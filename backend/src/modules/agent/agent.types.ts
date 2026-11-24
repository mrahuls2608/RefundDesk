import type { TransactionDoc } from '../transaction/transaction.model.js';

/** Facts handed to the agent by case management. The agent never loads or writes cases itself. */
export interface CaseFacts {
  caseId: number;
  userId: number;
  issueType: string;
  description: string | null;
  transaction: TransactionDoc;
}

export type AgentAction = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'REJECT';

export interface ProposalDraft {
  action: AgentAction;
  amountPaise: number;
  reasons: string[];
  confidence: number;
  model: string;
  promptVersion: string;
}

export type InvestigationResult =
  | { ok: true; proposal: ProposalDraft; llmCalls: number }
  | { ok: false; reason: string; llmCalls: number };
