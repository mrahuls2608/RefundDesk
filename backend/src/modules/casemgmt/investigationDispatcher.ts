import { randomUUID } from 'node:crypto';
import { logger } from '../../common/logger.js';
import { enqueueInvestigation, type AgentJobData } from '../../infra/queue.js';

type DispatchJob = Omit<AgentJobData, 'runId'>;

export type RunInvestigation = (caseId: number, runId: string) => Promise<void>;

export interface InvestigationDispatcher {
  newRunId(): string;
  dispatch(job: DispatchJob, runId: string): Promise<void>;
}

/**
 * Hands investigations to the BullMQ queue (Redis). If Redis is unavailable the job runs
 * in-process instead, so a Redis outage degrades latency, not correctness.
 */
export function createQueueDispatcher(runInProcess: RunInvestigation): InvestigationDispatcher {
  return {
    newRunId: () => randomUUID(),
    async dispatch(job, runId) {
      try {
        await enqueueInvestigation({ ...job, runId });
      } catch (err) {
        logger.warn({ event: 'AGENT_ENQUEUE_FAILED', caseId: job.caseId, err: (err as Error).message }, 'Running agent in-process');
        setImmediate(() => void runInProcess(job.caseId, runId));
      }
    },
  };
}

/** Runs investigations in the same process without Redis (tests and single-process demos). */
export function createInlineDispatcher(runInProcess: RunInvestigation): InvestigationDispatcher {
  return {
    newRunId: () => randomUUID(),
    async dispatch(job, runId) {
      setImmediate(() => void runInProcess(job.caseId, runId));
    },
  };
}
