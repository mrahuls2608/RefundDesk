import type { CaseStatus, IssueType, ProposalAction } from './api/types';

export const STATUS_LABEL: Record<CaseStatus, string> = {
  OPEN: 'Open',
  INVESTIGATING: 'Investigating',
  PROPOSED: 'Proposed',
  NEEDS_MANUAL_REVIEW: 'Manual review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REFUNDED: 'Refunded',
  CLOSED: 'Closed',
};

/** Customers see simpler states (Design §5.3). */
export type CustomerStatus = 'In review' | 'Approved' | 'Refunded' | 'Rejected' | 'Closed';

export function customerStatusOf(status: CaseStatus, outcome?: 'REFUNDED' | 'REJECTED' | null): CustomerStatus {
  switch (status) {
    case 'OPEN':
    case 'INVESTIGATING':
    case 'PROPOSED':
    case 'NEEDS_MANUAL_REVIEW':
      return 'In review';
    case 'APPROVED':
      return 'Approved';
    case 'REFUNDED':
      return 'Refunded';
    case 'REJECTED':
      return 'Rejected';
    case 'CLOSED':
      return outcome === 'REFUNDED' ? 'Refunded' : outcome === 'REJECTED' ? 'Rejected' : 'Closed';
  }
}

export const ISSUE_LABEL: Record<IssueType, string> = {
  DUPLICATE_CHARGE: 'Charged twice',
  FAILED_BUT_DEBITED: 'Payment failed but money was debited',
  WRONG_AMOUNT: 'Wrong amount',
  OTHER: 'Something else',
};

export const ISSUE_SHORT_LABEL: Record<IssueType, string> = {
  DUPLICATE_CHARGE: 'Charged twice',
  FAILED_BUT_DEBITED: 'Failed, debited',
  WRONG_AMOUNT: 'Wrong amount',
  OTHER: 'Other',
};

export const ACTION_LABEL: Record<ProposalAction, string> = {
  FULL_REFUND: 'Full refund',
  PARTIAL_REFUND: 'Partial refund',
  REJECT: 'Reject',
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  CASE_CREATED: 'Case created',
  INVESTIGATION_STARTED: 'AI investigation started',
  PROPOSAL_CREATED: 'Proposal created',
  PROPOSAL_UPDATED: 'Proposal edited',
  AGENT_FAILED: 'AI could not complete',
  AGENT_RERUN_REQUESTED: 'AI re-run requested',
  NOTE_ADDED: 'Note added',
  DECISION_APPROVED: 'Approved',
  DECISION_REJECTED: 'Rejected',
  REFUND_EXECUTED: 'Refund executed',
  CASE_CLOSED: 'Case closed',
};
