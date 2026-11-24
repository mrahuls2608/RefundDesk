import type { AgentDataSource } from '../../src/modules/agent/tools/agentDataSource.js';
import type { CaseFacts } from '../../src/modules/agent/agent.types.js';
import type { TransactionDoc } from '../../src/modules/transaction/transaction.model.js';

export const NOW = new Date('2026-11-24T10:00:00Z');

export function txn(overrides: Partial<TransactionDoc> = {}): TransactionDoc {
  return {
    _id: 101,
    userId: 1,
    amountPaise: 49900,
    currency: 'INR',
    merchant: 'FoodNow',
    status: 'SUCCESS',
    createdAt: new Date('2026-11-20T13:05:10Z'),
    ...overrides,
  };
}

export function facts(overrides: Partial<CaseFacts> = {}): CaseFacts {
  return { caseId: 42, userId: 1, issueType: 'DUPLICATE_CHARGE', description: 'Charged twice for one order', transaction: txn(), ...overrides };
}

export function memoryDataSource(transactions: TransactionDoc[]): AgentDataSource {
  return {
    async findRecentTransactions(userId, since) {
      return transactions.filter((t) => t.userId === userId && t.createdAt >= since);
    },
    async findTransaction(id) {
      return transactions.find((t) => t._id === id) ?? null;
    },
    async findActivePolicies(issueType) {
      return [{ _id: 1, issueType, ruleText: 'Refund duplicate charges within 10 minutes.', maxDays: 30, active: true }];
    },
  };
}
