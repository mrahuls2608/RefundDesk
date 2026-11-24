import { policyRepository } from '../../policy/policy.repository.js';
import type { PolicyRuleDoc } from '../../policy/policy.model.js';
import type { TransactionDoc } from '../../transaction/transaction.model.js';
import { transactionRepository } from '../../transaction/transaction.repository.js';

/**
 * Everything the agent can read. Read-only by construction: there is no write method here,
 * and the agent module is forbidden (by test) from importing refund or casemgmt code.
 */
export interface AgentDataSource {
  findRecentTransactions(userId: number, since: Date): Promise<TransactionDoc[]>;
  findTransaction(id: number): Promise<TransactionDoc | null>;
  findActivePolicies(issueType: string): Promise<PolicyRuleDoc[]>;
}

export const repositoryDataSource: AgentDataSource = {
  findRecentTransactions: (userId, since) => transactionRepository.findRecentForUser(userId, since),
  findTransaction: (id) => transactionRepository.findById(id),
  findActivePolicies: (issueType) => policyRepository.findActiveByIssueType(issueType),
};
