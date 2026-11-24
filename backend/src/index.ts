import type { Server } from 'node:http';
import type { Worker } from 'bullmq';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './common/logger.js';
import { createContainer } from './container.js';
import { connectDb, disconnectDb } from './infra/db.js';
import { closeQueues } from './infra/queue.js';
import { closeRedis } from './infra/redis.js';
import { startAgentWorker } from './workerRuntime.js';

async function main(): Promise<void> {
  await connectDb();
  const container = createContainer();
  const app = createApp({ caseService: container.caseService });
  const worker: Worker | undefined = env.RUN_WORKER_INLINE ? startAgentWorker(container.investigations) : undefined;
  const server: Server = app.listen(env.PORT, () => {
    logger.info({ event: 'API_STARTED', port: env.PORT, llmProvider: env.LLM_PROVIDER }, 'RefundDesk API listening');
  });

  const shutdown = async (signal: string) => {
    logger.info({ event: 'SHUTDOWN', signal }, 'Shutting down');
    server.close();
    await worker?.close();
    await closeQueues();
    await closeRedis();
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start');
  process.exit(1);
});
