import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { requestContext } from './requestContext.js';

export const TRACE_HEADER = 'X-Trace-Id';
const TRACE_ID_PATTERN = /^[A-Za-z0-9-]{6,64}$/;

/** Accepts a well-formed incoming trace id, otherwise generates one; echoes it on every response. */
export const traceIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = req.header(TRACE_HEADER);
  const traceId = incoming && TRACE_ID_PATTERN.test(incoming) ? incoming : randomUUID().slice(0, 12);
  res.setHeader(TRACE_HEADER, traceId);
  requestContext.run({ traceId }, () => next());
};
