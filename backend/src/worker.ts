import { logger } from './common/logger.js';
import { createContainer } from './container.js';
import { connectDb, disconnectDb } from './infra/db.js';
import { closeRedis } from './infra/redis.js';
import { startAgentWorker } from './workerRuntime.js';

/** Standalone agent worker: consumes investigation jobs from Redis (BullMQ). */
async function main(): Promise<void> {
  await connectDb();
  const { investigations } = createContainer();
  const worker = startAgentWorker(investigations, 4);
  const shutdown = async () => {
    await worker.close();
    await closeRedis();
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'Worker failed to start');
  process.exit(1);
});
