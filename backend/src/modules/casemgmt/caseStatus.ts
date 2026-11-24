export const CaseStatus = {
  OPEN: 'OPEN',
  INVESTIGATING: 'INVESTIGATING',
  PROPOSED: 'PROPOSED',
  NEEDS_MANUAL_REVIEW: 'NEEDS_MANUAL_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REFUNDED: 'REFUNDED',
  CLOSED: 'CLOSED',
} as const;

export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];

export const ALL_CASE_STATUSES = Object.values(CaseStatus);

export const IssueType = {
  DUPLICATE_CHARGE: 'DUPLICATE_CHARGE',
  FAILED_BUT_DEBITED: 'FAILED_BUT_DEBITED',
  WRONG_AMOUNT: 'WRONG_AMOUNT',
  OTHER: 'OTHER',
} as const;

export type IssueType = (typeof IssueType)[keyof typeof IssueType];

export const ALL_ISSUE_TYPES = Object.values(IssueType);

export const ProposalAction = {
  FULL_REFUND: 'FULL_REFUND',
  PARTIAL_REFUND: 'PARTIAL_REFUND',
  REJECT: 'REJECT',
} as const;

export type ProposalAction = (typeof ProposalAction)[keyof typeof ProposalAction];

export const ALL_PROPOSAL_ACTIONS = Object.values(ProposalAction);
