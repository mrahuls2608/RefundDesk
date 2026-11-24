import { z } from 'zod';
import { paiseToRupees } from '../../../common/money.js';
import type { TransactionDoc } from '../../transaction/transaction.model.js';
import type { ToolDefinition } from '../llm/types.js';
import type { AgentDataSource } from './agentDataSource.js';

export const MAX_LOOKBACK_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Tools are scoped to the case's customer; the model cannot choose whose data it sees. */
export interface ToolScope {
  userId: number;
  now: Date;
}

export interface AgentTool {
  definition: ToolDefinition;
  execute(rawArgs: string, scope: ToolScope): Promise<unknown>;
}

const GetTransactionsArgs = z.object({ days: z.coerce.number().int().min(1).max(MAX_LOOKBACK_DAYS).default(MAX_LOOKBACK_DAYS) });
const GetTransactionArgs = z.object({ transactionId: z.coerce.number().int().positive() });
const GetPolicyArgs = z.object({ issueType: z.string().max(30) });

export function createAgentTools(data: AgentDataSource): AgentTool[] {
  return [
    {
      definition: {
        name: 'getTransactions',
        description: `List the customer's transactions from the last N days (max ${MAX_LOOKBACK_DAYS}).`,
        parameters: {
          type: 'object',
          properties: { days: { type: 'integer', minimum: 1, maximum: MAX_LOOKBACK_DAYS } },
        },
      },
      async execute(rawArgs, scope) {
        const { days } = GetTransactionsArgs.parse(parseArgs(rawArgs));
        const since = new Date(scope.now.getTime() - days * DAY_MS);
        const txns = await data.findRecentTransactions(scope.userId, since);
        return { transactions: txns.map(toToolTransaction) };
      },
    },
    {
      definition: {
        name: 'getTransaction',
        description: 'Get one of the customer\'s transactions by id.',
        parameters: {
          type: 'object',
          properties: { transactionId: { type: 'integer' } },
          required: ['transactionId'],
        },
      },
      async execute(rawArgs, scope) {
        const { transactionId } = GetTransactionArgs.parse(parseArgs(rawArgs));
        const txn = await data.findTransaction(transactionId);
        if (!txn || txn.userId !== scope.userId) return { error: 'Transaction not found' };
        return { transaction: toToolTransaction(txn) };
      },
    },
    {
      definition: {
        name: 'getPolicy',
        description: 'Get the active refund policy rules for an issue type.',
        parameters: {
          type: 'object',
          properties: { issueType: { type: 'string', enum: ['DUPLICATE_CHARGE', 'FAILED_BUT_DEBITED', 'WRONG_AMOUNT', 'OTHER'] } },
          required: ['issueType'],
        },
      },
      async execute(rawArgs) {
        const { issueType } = GetPolicyArgs.parse(parseArgs(rawArgs));
        const rules = await data.findActivePolicies(issueType);
        return { rules: rules.map((r) => ({ ruleText: r.ruleText, maxDays: r.maxDays })) };
      },
    },
  ];
}

export function toToolTransaction(txn: TransactionDoc) {
  return {
    id: txn._id,
    amount: paiseToRupees(txn.amountPaise),
    merchant: txn.merchant,
    status: txn.status,
    createdAt: txn.createdAt.toISOString(),
  };
}

function parseArgs(rawArgs: string): unknown {
  if (!rawArgs.trim()) return {};
  return JSON.parse(rawArgs);
}
