import pino from 'pino';
import { env, isProduction } from '../config/env.js';

/**
 * JSON logs. Redaction makes sure tokens and passwords never reach the log sink,
 * even if someone logs a request object by mistake.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'refunddesk-api' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'passwordHash',
      '*.passwordHash',
      'accessToken',
      '*.accessToken',
    ],
    censor: '[REDACTED]',
  },
  ...(isProduction || env.NODE_ENV === 'test'
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true, singleLine: true } } }),
});
