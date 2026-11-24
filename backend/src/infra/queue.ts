import { Queue, Worker, type Job } from 'bullmq';
import { getRedis } from './redis.js';

export const AGENT_QUEUE = 'agent-investigations';

export interface AgentJobData {
  caseId: number;
  reason: 'CASE_CREATED' | 'RERUN';
  /** Identifies one agent run; a stale job whose runId no longer matches the case is skipped. */
  runId: string;
}

let agentQueue: Queue<AgentJobData> | undefined;

function getAgentQueue(): Queue<AgentJobData> {
  agentQueue ??= new Queue<AgentJobData>(AGENT_QUEUE, {
    connection: getRedis(),
    defaultJobOptions: { attempts: 1, removeOnComplete: 1000, removeOnFail: 1000 },
  });
  return agentQueue;
}

/**
 * Enqueued only after the case-creation transaction commits, so the worker never sees
 * a case that might still roll back. The jobId dedupes double-enqueues for the same run.
 */
export async function enqueueInvestigation(data: AgentJobData): Promise<void> {
  await getAgentQueue().add('investigate', data, { jobId: `case-${data.caseId}-${data.runId}` });
}

export function createAgentWorker(
  handler: (job: Job<AgentJobData>) => Promise<void>,
  concurrency = 2,
): Worker<AgentJobData> {
  return new Worker<AgentJobData>(AGENT_QUEUE, handler, { connection: getRedis(), concurrency });
}

export async function closeQueues(): Promise<void> {
  await agentQueue?.close();
  agentQueue = undefined;
}
