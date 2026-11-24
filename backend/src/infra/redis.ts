import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../common/logger.js';

let client: Redis | undefined;

/** Shared Redis connection: login rate limiting, policy cache and the agent job queue. */
export function getRedis(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: false });
    client.on('error', (err) => logger.warn({ err: err.message, event: 'REDIS_ERROR' }, 'Redis error'));
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = undefined;
  }
}
