import type { ClientSession } from 'mongoose';
import { AmountExceedsTransactionError, ConcurrentUpdateError, NotFoundError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { formatPaise, rupeesToPaise } from '../../common/money.js';
import { withTransaction } from '../../infra/db.js';
import { metrics } from '../../metrics/metrics.js';
import type { AuthPrincipal } from '../../security/jwt.js';
import { SYSTEM_ACTOR } from '../audit/audit.service.js';
import type { RefundDoc } from '../refund/refund.model.js';
import { refundKeyForCase, refundService } from '../refund/refund.service.js';
import { transactionRepository } from '../transaction/transaction.repository.js';
import type { DecisionInput } from './case.dto.js';
import { CaseModel, type CaseDoc } from './case.model.js';
import { actorOf, latestProposal } from './case.service.js';
import { toRefundView } from './case.views.js';
import { caseStateMachine } from './caseStateMachine.js';
import { CaseStatus, ProposalAction } from './caseStatus.js';
import { transitionCase } from './caseTransitions.js';
import { DecisionModel, DecisionType } from './decision.model.js';
import { AGENT_ACTOR } from './proposal.model.js';

const DUPLICATE_KEY = 11000;

/**
 * The only code path that can move money (golden rule 1). Everything happens in one MongoDB
 * transaction: version check → decision → APPROVED → idempotent refund → REFUNDED → CLOSED.
 * A double-submitted decision fails the version check (409) and never creates a second refund;
 * even if it got through, the refund key `case-{id}` and the unique index stop a duplicate.
 */
export const decisionService = {
  async decide(approver: AuthPrincipal, caseId: number, input: DecisionInput) {
    let refund: RefundDoc | null = null;
    const closed = await withTransaction(async (session) => {
      const caseDoc = await loadForDecision(caseId, input.version, session);
      const txn = await transactionRepository.findById(caseDoc.transactionId);
      if (!txn) throw new NotFoundError('Transaction', caseDoc.transactionId);
      const target = input.decision === DecisionType.APPROVE ? CaseStatus.APPROVED : CaseStatus.REJECTED;
      caseStateMachine.assertTransition(caseId, caseDoc.status, target);
      const finalAmountPaise = input.decision === DecisionType.APPROVE ? checkedAmount(input.finalAmount!, txn.amountPaise) : null;
      await saveDecision(caseId, approver, input, finalAmountPaise, session);
      const actor = actorOf(approver);
      if (finalAmountPaise === null) {
        const rejected = await transitionCase(caseDoc, { to: CaseStatus.REJECTED, actor, action: 'DECISION_REJECTED', details: { comment: input.comment } }, session);
        return transitionCase(rejected, { to: CaseStatus.CLOSED, actor: SYSTEM_ACTOR, action: 'CASE_CLOSED' }, session);
      }
      const approved = await transitionCase(
        caseDoc,
        { to: CaseStatus.APPROVED, actor, action: 'DECISION_APPROVED', details: { finalAmount: formatPaise(finalAmountPaise), comment: input.comment } },
        session,
      );
      refund = await refundService.execute(caseId, finalAmountPaise, refundKeyForCase(caseId), session);
      const refunded = await transitionCase(
        approved,
        {
          to: CaseStatus.REFUNDED,
          actor: SYSTEM_ACTOR,
          action: 'REFUND_EXECUTED',
          details: { refundId: String(refund._id), amount: formatPaise(refund.amountPaise), idempotencyKey: refund.idempotencyKey },
        },
        session,
      );
      return transitionCase(refunded, { to: CaseStatus.CLOSED, actor: SYSTEM_ACTOR, action: 'CASE_CLOSED' }, session);
    }).catch((err: unknown) => {
      if ((err as { code?: number }).code === DUPLICATE_KEY) throw new ConcurrentUpdateError(caseId);
      throw err;
    });
    await recordDecisionMetrics(caseId, input.decision);
    logger.info({ event: 'DECISION_MADE', caseId, decision: input.decision, approverId: approver.id }, 'Decision recorded');
    // Response reports the money outcome; the case itself is now CLOSED (see timeline).
    const finalRefund = refund as RefundDoc | null;
    return {
      status: finalRefund ? CaseStatus.REFUNDED : CaseStatus.REJECTED,
      caseStatus: closed.status,
      version: closed.version,
      refund: finalRefund ? toRefundView(finalRefund) : null,
    };
  },
};

async function loadForDecision(caseId: number, expectedVersion: number, session: ClientSession): Promise<CaseDoc> {
  const caseDoc = await CaseModel.findById(caseId).session(session).lean<CaseDoc>();
  if (!caseDoc) throw new NotFoundError('Case', caseId);
  if (caseDoc.version !== expectedVersion) throw new ConcurrentUpdateError(caseId);
  return caseDoc;
}

function checkedAmount(finalAmountRupees: number, txnAmountPaise: number): number {
  const amountPaise = rupeesToPaise(finalAmountRupees);
  if (amountPaise > txnAmountPaise) {
    throw new AmountExceedsTransactionError(formatPaise(amountPaise), formatPaise(txnAmountPaise));
  }
  return amountPaise;
}

async function saveDecision(
  caseId: number,
  approver: AuthPrincipal,
  input: DecisionInput,
  finalAmountPaise: number | null,
  session: ClientSession,
): Promise<void> {
  await DecisionModel.create(
    [{ caseId, approverId: approver.id, decision: input.decision, finalAmountPaise, comment: input.comment }],
    { session },
  );
}

/** Agent accuracy signal: did the approver agree with the AI's proposed action? */
async function recordDecisionMetrics(caseId: number, decision: DecisionType): Promise<void> {
  metrics.decisions.inc({ decision });
  const proposal = await latestProposal(caseId);
  if (proposal?.createdBy !== AGENT_ACTOR) return;
  const aiApproved = proposal.action !== ProposalAction.REJECT;
  const agreed = aiApproved === (decision === DecisionType.APPROVE);
  metrics.agentAgreement.inc({ agreed: String(agreed) });
}
