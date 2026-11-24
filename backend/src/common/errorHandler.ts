import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, ErrorCode, NotFoundError, type ApiErrorBody } from './errors.js';
import { logger } from './logger.js';
import { currentTraceId } from './requestContext.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError('Route', `${req.method} ${req.path}`));
};

/** Maps every error to `{ code, message, traceId }`. Never leaks stack traces or internals. */
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  const traceId = currentTraceId();
  if (err instanceof AppError) {
    const body: ApiErrorBody = { code: err.code, message: err.message, traceId };
    if (err.fields) body.fields = err.fields;
    res.status(err.httpStatus).json(body);
    return;
  }
  if (isMalformedJson(err)) {
    res.status(400).json({ code: ErrorCode.VALIDATION_FAILED, message: 'Malformed JSON body', traceId });
    return;
  }
  logger.error({ err, traceId, event: 'UNHANDLED_ERROR' }, 'Unhandled error');
  res.status(500).json({ code: ErrorCode.INTERNAL_ERROR, message: 'Something went wrong', traceId });
};

function isMalformedJson(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed';
}
