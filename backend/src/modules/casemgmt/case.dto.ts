import { z } from 'zod';
import { paiseToRupees } from '../../common/money.js';
import { ALL_CASE_STATUSES, ALL_ISSUE_TYPES, ALL_PROPOSAL_ACTIONS } from './caseStatus.js';
import type { ProposalDoc } from './proposal.model.js';

export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_NOTE_LENGTH = 2000;
export const MAX_COMMENT_LENGTH = 500;
export const MAX_REASONS = 5;

const rupees = z
  .number()
  .nonnegative()
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'At most 2 decimal places');

export const CreateCaseSchema = z.object({
  transactionId: z.number().int().positive(),
  issueType: z.enum(ALL_ISSUE_TYPES),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).optional().nullable(),
});

const csvOf = <T extends string>(values: readonly T[]) =>
  z
    .string()
    .optional()
    .transform((raw) => (raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : []))
    .pipe(z.array(z.enum(values as [T, ...T[]])));

export const ListCasesQuerySchema = z.object({
  status: csvOf(ALL_CASE_STATUSES),
  issueType: csvOf(ALL_ISSUE_TYPES),
  sort: z.enum(['oldest', 'newest']).default('oldest'),
  q: z.string().trim().max(20).optional(),
});

export const AddNoteSchema = z.object({ body: z.string().trim().min(1).max(MAX_NOTE_LENGTH) });

export const UpdateProposalSchema = z.object({
  action: z.enum(ALL_PROPOSAL_ACTIONS),
  amount: rupees,
  reasons: z.array(z.string().trim().min(1).max(300)).min(1).max(MAX_REASONS),
});

export const DecisionSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT']),
    finalAmount: rupees.optional().nullable(),
    comment: z.string().trim().min(1).max(MAX_COMMENT_LENGTH),
    version: z.number().int().min(0),
  })
  .refine((d) => d.decision === 'REJECT' || (d.finalAmount != null && d.finalAmount > 0), {
    path: ['finalAmount'],
    message: 'finalAmount must be greater than 0 to approve',
  });

export type CreateCaseInput = z.infer<typeof CreateCaseSchema>;
export type ListCasesQuery = z.infer<typeof ListCasesQuerySchema>;
export type UpdateProposalInput = z.infer<typeof UpdateProposalSchema>;
export type DecisionInput = z.infer<typeof DecisionSchema>;

export interface ProposalResponse {
  action: string;
  amount: number;
  confidence?: number | null;
  reasons?: string[];
  createdBy: string;
  model?: string | null;
  promptVersion?: string | null;
  createdAt: string;
}

export function toProposalResponse(p: ProposalDoc, includeInternals: boolean): ProposalResponse {
  const base = { action: p.action, amount: paiseToRupees(p.amountPaise), createdBy: p.createdBy, createdAt: p.createdAt.toISOString() };
  if (!includeInternals) return base;
  return { ...base, confidence: p.confidence, reasons: p.reasons, model: p.model, promptVersion: p.promptVersion };
}
