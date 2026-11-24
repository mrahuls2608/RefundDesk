import type { Worker } from 'bullmq';
import { logger } from './common/logger.js';
import { createAgentWorker } from './infra/queue.js';
import type { InvestigationService } from './modules/casemgmt/investigation.service.js';

export function startAgentWorker(investigations: InvestigationService, concurrency = 2): Worker {
  const worker = createAgentWorker(async (job) => {
    await investigations.run(job.data.caseId, job.data.runId);
  }, concurrency);
  worker.on('failed', (job, err) =>
    logger.error({ event: 'AGENT_JOB_FAILED', caseId: job?.data.caseId, err: err.message }, 'Agent job failed'),
  );
  logger.info({ event: 'AGENT_WORKER_STARTED', concurrency }, 'Agent worker started');
  return worker;
}
