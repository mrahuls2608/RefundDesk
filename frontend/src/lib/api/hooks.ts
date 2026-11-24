'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type CaseFilters, type DecisionInput, type ProposalInput } from './endpoints';
import type { CaseStatus, IssueType } from './types';

/** Server state lives in TanStack Query. Apps call these hooks, never fetch directly. */
export const queryKeys = {
  transactions: ['transactions'] as const,
  cases: (filters: CaseFilters) => ['cases', filters] as const,
  case: (id: number) => ['case', id] as const,
  audit: (id: number) => ['audit', id] as const,
  adminUsers: ['admin', 'users'] as const,
  policies: ['admin', 'policies'] as const,
};

const POLL_MS = 5000;
/** Poll only while the AI is still working (Rules §6.5). */
const POLLING_STATUSES: readonly CaseStatus[] = ['OPEN', 'INVESTIGATING'];

export function useTransactions() {
  return useQuery({ queryKey: queryKeys.transactions, queryFn: () => api.transactions() });
}

export function useCases(filters: CaseFilters) {
  return useQuery({ queryKey: queryKeys.cases(filters), queryFn: () => api.cases(filters), placeholderData: keepPreviousData });
}

export function useCase(id: number) {
  return useQuery({
    queryKey: queryKeys.case(id),
    queryFn: () => api.case(id),
    enabled: Number.isInteger(id) && id > 0,
    refetchInterval: (query) => (query.state.data && POLLING_STATUSES.includes(query.state.data.status) ? POLL_MS : false),
  });
}

export function useAudit(id: number) {
  return useQuery({ queryKey: queryKeys.audit(id), queryFn: () => api.audit(id) });
}

export function useCreateCase() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { transactionId: number; issueType: IssueType; description?: string }) => api.createCase(input),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.transactions }),
  });
}

function useCaseMutation<TInput, TResult>(caseId: number, fn: (input: TInput) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.case(caseId) }),
        client.invalidateQueries({ queryKey: queryKeys.audit(caseId) }),
        client.invalidateQueries({ queryKey: ['cases'] }),
      ]);
    },
  });
}

export const useAddNote = (caseId: number) => useCaseMutation(caseId, (body: string) => api.addNote(caseId, body));
export const useUpdateProposal = (caseId: number) => useCaseMutation(caseId, (input: ProposalInput) => api.updateProposal(caseId, input));
export const useRerunAgent = (caseId: number) => useCaseMutation(caseId, () => api.rerunAgent(caseId));
export const useDecision = (caseId: number) => useCaseMutation(caseId, (input: DecisionInput) => api.decide(caseId, input));

export function useAdminUsers() {
  return useQuery({ queryKey: queryKeys.adminUsers, queryFn: api.adminUsers });
}

export function usePolicies() {
  return useQuery({ queryKey: queryKeys.policies, queryFn: api.policies });
}

export function useCreateUser() {
  const client = useQueryClient();
  return useMutation({ mutationFn: api.createUser, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.adminUsers }) });
}

export function useUpdatePolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; ruleText: string; maxDays: number | null; active: boolean }) => api.updatePolicy(id, body),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.policies }),
  });
}
