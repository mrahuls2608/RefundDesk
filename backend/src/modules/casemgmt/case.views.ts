import { paiseToRupees } from '../../common/money.js';
import type { AuditEntryDoc } from '../audit/audit.model.js';
import type { RefundDoc } from '../refund/refund.model.js';
import type { TransactionDoc } from '../transaction/transaction.model.js';
import type { CaseDoc } from './case.model.js';
import type { DecisionDoc } from './decision.model.js';
import type { NoteDoc } from './note.model.js';
import { toProposalResponse } from './case.dto.js';
import type { ProposalDoc } from './proposal.model.js';

export const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export interface CaseDetailParts {
  caseDoc: CaseDoc;
  transaction: TransactionDoc;
  customerName: string;
  proposal: ProposalDoc | null;
  decision: (DecisionDoc & { approverName: string }) | null;
  refund: RefundDoc | null;
  audit: AuditEntryDoc[];
  notes: NoteDoc[];
  related: TransactionDoc[];
}

/** Shapes the case detail per audience: customers never see reasons, confidence, model, notes or actors. */
export function toCaseDetail(parts: CaseDetailParts, staffView: boolean) {
  const { caseDoc, transaction, proposal, decision, refund } = parts;
  const base = {
    id: caseDoc._id,
    status: caseDoc.status,
    version: caseDoc.version,
    issueType: caseDoc.issueType,
    description: caseDoc.description,
    createdAt: caseDoc.createdAt.toISOString(),
    updatedAt: caseDoc.updatedAt.toISOString(),
    transaction: toTxnSummary(transaction),
    proposal: proposal ? toProposalResponse(proposal, staffView) : null,
    decision: decision ? toDecisionView(decision, staffView) : null,
    refund: refund ? toRefundView(refund) : null,
    timeline: toTimeline(parts.audit, staffView),
  };
  if (!staffView) return base;
  return {
    ...base,
    customer: { id: caseDoc.userId, name: parts.customerName },
    notes: parts.notes.map(toNoteView),
    relatedTransactions: parts.related.map((t) => ({
      ...toTxnSummary(t),
      isCaseTransaction: t._id === transaction._id,
      possibleDuplicate: isPossibleDuplicate(t, transaction),
    })),
  };
}

export function toTxnSummary(t: TransactionDoc) {
  return {
    id: t._id,
    amount: paiseToRupees(t.amountPaise),
    currency: t.currency,
    merchant: t.merchant,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  };
}

export function toRefundView(r: RefundDoc) {
  return { id: String(r._id), amount: paiseToRupees(r.amountPaise), status: r.status, idempotencyKey: r.idempotencyKey, createdAt: r.createdAt.toISOString() };
}

export function toNoteView(n: NoteDoc) {
  return { id: String(n._id), author: n.authorName, body: n.body, createdAt: n.createdAt.toISOString() };
}

export function toAuditView(e: AuditEntryDoc) {
  return {
    id: String(e._id),
    actor: e.actorName,
    actorId: e.actorId,
    action: e.action,
    from: e.fromStatus,
    to: e.toStatus,
    details: e.details,
    at: e.createdAt.toISOString(),
  };
}

function toDecisionView(d: DecisionDoc & { approverName: string }, staffView: boolean) {
  const showComment = staffView || d.decision === 'REJECT';
  return {
    decision: d.decision,
    finalAmount: d.finalAmountPaise === null ? null : paiseToRupees(d.finalAmountPaise),
    comment: showComment ? d.comment : null,
    approver: staffView ? d.approverName : null,
    createdAt: d.createdAt.toISOString(),
  };
}

function toTimeline(audit: AuditEntryDoc[], staffView: boolean) {
  return audit
    .filter((e) => e.toStatus && e.toStatus !== e.fromStatus)
    .map((e) => ({ status: e.toStatus!, at: e.createdAt.toISOString(), ...(staffView && { actor: e.actorName }) }));
}

function isPossibleDuplicate(candidate: TransactionDoc, caseTxn: TransactionDoc): boolean {
  return (
    candidate._id !== caseTxn._id &&
    candidate.merchant === caseTxn.merchant &&
    candidate.amountPaise === caseTxn.amountPaise &&
    Math.abs(candidate.createdAt.getTime() - caseTxn.createdAt.getTime()) <= DUPLICATE_WINDOW_MS
  );
}
