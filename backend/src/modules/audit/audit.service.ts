import type { ClientSession } from 'mongoose';
import { AuditEntryModel, type AuditEntryDoc } from './audit.model.js';

export const SYSTEM_ACTOR = { id: 'SYSTEM', name: 'System' } as const;
export const AGENT_ACTOR_REF = { id: 'AGENT', name: 'AI agent' } as const;

export interface Actor {
  id: string;
  name: string;
}

export interface AuditInput {
  caseId: number | null;
  actor: Actor;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  details?: Record<string, unknown> | null;
}

/** Append-only audit trail. Callers pass the session so the entry commits with the change it records. */
export const auditService = {
  async record(input: AuditInput, session?: ClientSession): Promise<void> {
    await AuditEntryModel.create(
      [
        {
          caseId: input.caseId,
          actorId: input.actor.id,
          actorName: input.actor.name,
          action: input.action,
          fromStatus: input.fromStatus ?? null,
          toStatus: input.toStatus ?? null,
          details: input.details ?? null,
        },
      ],
      { session },
    );
  },

  listForCase(caseId: number): Promise<AuditEntryDoc[]> {
    return AuditEntryModel.find({ caseId }).sort({ createdAt: 1, _id: 1 }).lean<AuditEntryDoc[]>().exec();
  },
};
