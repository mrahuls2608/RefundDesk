/** API response shapes (TRD §6.3). Keep in sync with the backend DTOs. */
export type Role = 'CUSTOMER' | 'OPS' | 'APPROVER' | 'ADMIN';
export type CaseStatus =
  | 'OPEN' | 'INVESTIGATING' | 'PROPOSED' | 'NEEDS_MANUAL_REVIEW' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'CLOSED';
export type IssueType = 'DUPLICATE_CHARGE' | 'FAILED_BUT_DEBITED' | 'WRONG_AMOUNT' | 'OTHER';
export type ProposalAction = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'REJECT';
export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  traceId: string;
  fields?: Record<string, string>;
}

export interface AuthUser {
  id: number;
  name: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface Me extends AuthUser {
  email: string;
}

export interface Transaction {
  id: number;
  amount: number;
  currency: string;
  merchant: string;
  status: TransactionStatus;
  createdAt: string;
  hasOpenCase: boolean;
  openCaseId: number | null;
}

export interface TransactionSummary {
  id: number;
  amount: number;
  currency: string;
  merchant: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface Proposal {
  action: ProposalAction;
  amount: number;
  confidence?: number | null;
  reasons?: string[];
  createdBy: string;
  model?: string | null;
  promptVersion?: string | null;
  createdAt: string;
}

export interface Decision {
  decision: 'APPROVE' | 'REJECT';
  finalAmount: number | null;
  comment: string | null;
  approver: string | null;
  createdAt: string;
}

export interface Refund {
  id: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  idempotencyKey: string;
  createdAt: string;
}

export interface TimelineEntry {
  status: CaseStatus;
  at: string;
  actor?: string;
}

export interface Note {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface RelatedTransaction extends TransactionSummary {
  isCaseTransaction: boolean;
  possibleDuplicate: boolean;
}

export interface CaseDetail {
  id: number;
  status: CaseStatus;
  version: number;
  issueType: IssueType;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  transaction: TransactionSummary;
  proposal: Proposal | null;
  decision: Decision | null;
  refund: Refund | null;
  timeline: TimelineEntry[];
  /** Staff only */
  customer?: { id: number; name: string };
  notes?: Note[];
  relatedTransactions?: RelatedTransaction[];
}

export interface CaseListItem {
  id: number;
  customerName: string;
  amount: number;
  merchant: string;
  transactionId: number;
  issueType: IssueType;
  status: CaseStatus;
  ageMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  actorId: string;
  action: string;
  from: CaseStatus | null;
  to: CaseStatus | null;
  details: Record<string, unknown> | null;
  at: string;
}

export interface DecisionResponse {
  status: 'REFUNDED' | 'REJECTED';
  caseStatus: CaseStatus;
  version: number;
  refund: Refund | null;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface PolicyRule {
  id: number;
  issueType: IssueType;
  ruleText: string;
  maxDays: number | null;
  active: boolean;
}
