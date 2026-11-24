import { logger } from '../../common/logger.js';
import { formatPaise } from '../../common/money.js';
import { requestContext } from '../../common/requestContext.js';
import { withTransaction } from '../../infra/db.js';
import { metrics } from '../../metrics/metrics.js';
import type { AgentService, CaseFacts, InvestigationResult } from '../agent/index.js';
import { AGENT_ACTOR_REF, SYSTEM_ACTOR } from '../audit/audit.service.js';
import { transactionRepository } from '../transaction/transaction.repository.js';
import { CaseModel, type CaseDoc } from './case.model.js';
import { CaseStatus } from './caseStatus.js';
import { transitionCase } from './caseTransitions.js';
import { AGENT_ACTOR, ProposalModel } from './proposal.model.js';

/**
 * Runs one agent investigation and records the outcome. Case management owns all writes:
 * the agent only returns a draft, which is saved here together with the PROPOSED transition.
 * Any failure ends in NEEDS_MANUAL_REVIEW with an AGENT_FAILED audit entry, never a refund.
 */
export function createInvestigationService(agent: AgentService) {
  async function run(caseId: number, runId: string): Promise<void> {
    await requestContext.run({ traceId: `agent-${runId.slice(0, 8)}`, caseId }, async () => {
      const started = await startInvestigation(caseId, runId);
      if (!started) return;
      let result: InvestigationResult;
      try {
        result = await agent.investigate(await loadFacts(started));
      } catch (err) {
        result = { ok: false, reason: `Agent crashed: ${(err as Error).message}`, llmCalls: 0 };
      }
      await recordOutcome(started, runId, result);
    });
  }

  return { run };
}

export type InvestigationService = ReturnType<typeof createInvestigationService>;

/** Moves OPEN → INVESTIGATING. Returns null when the job is stale (case moved on or re-run since). */
async function startInvestigation(caseId: number, runId: string): Promise<CaseDoc | null> {
  const current = await CaseModel.findById(caseId).lean<CaseDoc>();
  if (!current || current.agentRunId !== runId) {
    logger.info({ event: 'AGENT_JOB_STALE', caseId }, 'Skipping stale investigation job');
    return null;
  }
  if (current.status === CaseStatus.INVESTIGATING) return current;
  if (current.status !== CaseStatus.OPEN) return null;
  return withTransaction((session) =>
    transitionCase(current, { to: CaseStatus.INVESTIGATING, actor: SYSTEM_ACTOR, action: 'INVESTIGATION_STARTED' }, session),
  );
}

async function loadFacts(caseDoc: CaseDoc): Promise<CaseFacts> {
  const transaction = await transactionRepository.findById(caseDoc.transactionId);
  if (!transaction) throw new Error(`Transaction ${caseDoc.transactionId} missing`);
  return {
    caseId: caseDoc._id,
    userId: caseDoc.userId,
    issueType: caseDoc.issueType,
    description: caseDoc.description,
    transaction,
  };
}

async function recordOutcome(caseDoc: CaseDoc, runId: string, result: InvestigationResult): Promise<void> {
  const latest = await CaseModel.findById(caseDoc._id).lean<CaseDoc>();
  if (!latest || latest.agentRunId !== runId || latest.status !== CaseStatus.INVESTIGATING) {
    logger.info({ event: 'AGENT_RESULT_DISCARDED', caseId: caseDoc._id }, 'Case changed during investigation');
    return;
  }
  if (result.ok) {
    const { proposal } = result;
    await withTransaction(async (session) => {
      await ProposalModel.create(
        [{ caseId: latest._id, ...proposal, createdBy: AGENT_ACTOR }],
        { session },
      );
      await transitionCase(
        latest,
        {
          to: CaseStatus.PROPOSED,
          actor: AGENT_ACTOR_REF,
          action: 'PROPOSAL_CREATED',
          details: {
            action: proposal.action,
            amount: formatPaise(proposal.amountPaise),
            confidence: proposal.confidence,
            model: proposal.model,
            promptVersion: proposal.promptVersion,
            llmCalls: result.llmCalls,
          },
        },
        session,
      );
    });
    metrics.proposalsCreated.inc({ source: 'agent' });
    return;
  }
  logger.warn({ event: 'AGENT_FAILED', caseId: latest._id, reason: result.reason }, 'Agent failed; manual review');
  await withTransaction((session) =>
    transitionCase(
      latest,
      { to: CaseStatus.NEEDS_MANUAL_REVIEW, actor: AGENT_ACTOR_REF, action: 'AGENT_FAILED', details: { reason: result.reason, llmCalls: result.llmCalls } },
      session,
    ),
  );
}
