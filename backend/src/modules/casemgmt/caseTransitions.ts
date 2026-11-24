import type { ClientSession } from 'mongoose';
import { ConcurrentUpdateError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { auditService, type Actor } from '../audit/audit.service.js';
import { CaseModel, isOpenStatus, type CaseDoc } from './case.model.js';
import { caseStateMachine } from './caseStateMachine.js';
import type { CaseStatus } from './caseStatus.js';

export interface TransitionInput {
  to: CaseStatus;
  actor: Actor;
  action: string;
  details?: Record<string, unknown>;
  extraSet?: Partial<Pick<CaseDoc, 'agentRunId'>>;
}

/**
 * The single path for changing a case's status (golden rule 4). Checks the state machine,
 * applies an optimistic-lock update on `version`, and writes the audit entry in the same session.
 */
export async function transitionCase(current: CaseDoc, input: TransitionInput, session: ClientSession): Promise<CaseDoc> {
  caseStateMachine.assertTransition(current._id, current.status, input.to);
  const updated = await CaseModel.findOneAndUpdate(
    { _id: current._id, version: current.version },
    {
      $set: { status: input.to, isOpen: isOpenStatus(input.to), ...input.extraSet },
      $inc: { version: 1 },
    },
    { new: true, session },
  ).lean<CaseDoc>();
  if (!updated) throw new ConcurrentUpdateError(current._id);
  await auditService.record(
    {
      caseId: current._id,
      actor: input.actor,
      action: input.action,
      fromStatus: current.status,
      toStatus: input.to,
      details: input.details ?? null,
    },
    session,
  );
  logger.info(
    { event: 'CASE_TRANSITION', caseId: current._id, from: current.status, to: input.to, action: input.action },
    'Case status changed',
  );
  return updated;
}
