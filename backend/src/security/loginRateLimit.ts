import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { RateLimitedError } from '../common/errors.js';
import { logger } from '../common/logger.js';
import { getRedis } from '../infra/redis.js';

const WINDOW_SECONDS = 60;

/**
 * Fixed-window limiter in Redis (INCR + EXPIRE), shared across API instances:
 * LOGIN_RATE_LIMIT_PER_MIN attempts per IP per minute. Fails open if Redis is down,
 * because locking every user out is worse than briefly losing the limit.
 */
export const loginRateLimit: RequestHandler = async (req, _res, next) => {
  const key = `ratelimit:login:${req.ip ?? 'unknown'}`;
  let attempts: number;
  try {
    const [[, count]] = (await getRedis().multi().incr(key).expire(key, WINDOW_SECONDS, 'NX').exec()) as [
      [Error | null, number],
    ];
    attempts = count;
  } catch (err) {
    logger.warn({ err: (err as Error).message, event: 'RATE_LIMIT_UNAVAILABLE' }, 'Rate limiter unavailable');
    next();
    return;
  }
  if (attempts > env.LOGIN_RATE_LIMIT_PER_MIN) {
    throw new RateLimitedError();
  }
  next();
};
