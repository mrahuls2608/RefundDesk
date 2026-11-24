import { z } from 'zod';
import { isValidRupeeAmount, rupeesToPaise } from '../../common/money.js';
import type { AgentAction } from './agent.types.js';

const MAX_REASONS = 5;
const MAX_REASON_LENGTH = 300;

const RawProposalSchema = z.object({
  action: z.enum(['FULL_REFUND', 'PARTIAL_REFUND', 'REJECT']),
  amount: z.number().refine(isValidRupeeAmount, 'amount must be >= 0 with at most 2 decimals'),
  reasons: z.array(z.string().trim().min(1).max(MAX_REASON_LENGTH)).min(1).max(MAX_REASONS),
  confidence: z.number().min(0).max(1),
});

export interface ValidProposal {
  action: AgentAction;
  amountPaise: number;
  reasons: string[];
  confidence: number;
}

export type ValidationOutcome = { valid: true; proposal: ValidProposal } | { valid: false; error: string };

/**
 * Never trust LLM output: parse JSON, check the schema and enums, and enforce the amount rules
 * against the real transaction amount in code.
 */
export function validateProposal(content: string | null, transactionAmountPaise: number): ValidationOutcome {
  const json = extractJson(content);
  if (json === undefined) return { valid: false, error: 'Output was not a JSON object' };
  const parsed = RawProposalSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    return { valid: false, error: `${issue.path.join('.') || 'output'}: ${issue.message}` };
  }
  const { action, amount, reasons, confidence } = parsed.data;
  const amountPaise = rupeesToPaise(amount);
  const amountError = checkAmount(action, amountPaise, transactionAmountPaise);
  if (amountError) return { valid: false, error: amountError };
  return { valid: true, proposal: { action, amountPaise, reasons, confidence } };
}

function checkAmount(action: AgentAction, amountPaise: number, limitPaise: number): string | null {
  if (amountPaise > limitPaise) return 'amount exceeds the transaction amount';
  if (action === 'REJECT' && amountPaise !== 0) return 'amount must be 0 for REJECT';
  if (action === 'FULL_REFUND' && amountPaise !== limitPaise) return 'amount must equal the transaction amount for FULL_REFUND';
  if (action === 'PARTIAL_REFUND' && (amountPaise <= 0 || amountPaise >= limitPaise)) {
    return 'PARTIAL_REFUND amount must be between 0 and the transaction amount';
  }
  return null;
}

/** Accepts a bare JSON object, optionally wrapped in a ```json fence. */
function extractJson(content: string | null): unknown {
  if (!content) return undefined;
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1]! : content).trim();
  if (!candidate.startsWith('{')) return undefined;
  try {
    return JSON.parse(candidate);
  } catch {
    return undefined;
  }
}
