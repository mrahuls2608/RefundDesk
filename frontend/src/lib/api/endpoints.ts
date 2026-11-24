import { apiRequest } from './http';
import type {
  AdminUser, AuditEntry, CaseDetail, CaseListItem, CaseStatus, DecisionResponse, IssueType, LoginResponse, Me, Note, Page,
  PolicyRule, Proposal, ProposalAction, Transaction,
} from './types';

export interface CaseFilters {
  status?: CaseStatus[];
  issueType?: IssueType | '';
  sort?: 'oldest' | 'newest';
  q?: string;
  page?: number;
  size?: number;
}

export interface ProposalInput {
  action: ProposalAction;
  amount: number;
  reasons: string[];
}

export interface DecisionInput {
  decision: 'APPROVE' | 'REJECT';
  finalAmount?: number;
  comment: string;
  version: number;
}

export const api = {
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', body: { email, password }, skipAuthRedirect: true }),
  me: () => apiRequest<Me>('/api/me'),
  transactions: (page = 0, size = 50) => apiRequest<Page<Transaction>>('/api/transactions', { query: { page, size } }),
  cases: (f: CaseFilters) =>
    apiRequest<Page<CaseListItem>>('/api/cases', {
      query: { status: f.status?.join(','), issueType: f.issueType, sort: f.sort, q: f.q, page: f.page, size: f.size },
    }),
  case: (id: number) => apiRequest<CaseDetail>(`/api/cases/${id}`),
  createCase: (body: { transactionId: number; issueType: IssueType; description?: string }) =>
    apiRequest<{ id: number; status: CaseStatus; createdAt: string }>('/api/cases', { method: 'POST', body }),
  addNote: (id: number, body: string) => apiRequest<Note>(`/api/cases/${id}/notes`, { method: 'POST', body: { body } }),
  updateProposal: (id: number, body: ProposalInput) => apiRequest<Proposal>(`/api/cases/${id}/proposal`, { method: 'PUT', body }),
  rerunAgent: (id: number) => apiRequest<{ status: CaseStatus }>(`/api/cases/${id}/rerun-agent`, { method: 'POST' }),
  decide: (id: number, body: DecisionInput) => apiRequest<DecisionResponse>(`/api/cases/${id}/decision`, { method: 'POST', body }),
  audit: (id: number) => apiRequest<AuditEntry[]>(`/api/cases/${id}/audit`),
  adminUsers: () => apiRequest<AdminUser[]>('/api/admin/users'),
  createUser: (body: { name: string; email: string; password: string; role: string }) =>
    apiRequest<AdminUser>('/api/admin/users', { method: 'POST', body }),
  policies: () => apiRequest<PolicyRule[]>('/api/admin/policies'),
  updatePolicy: (id: number, body: { ruleText: string; maxDays: number | null; active: boolean }) =>
    apiRequest<PolicyRule>(`/api/admin/policies/${id}`, { method: 'PUT', body }),
};
