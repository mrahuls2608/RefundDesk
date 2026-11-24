import { AsyncLocalStorage } from 'node:async_hooks';

/** Per-request context (the Node equivalent of SLF4J's MDC). */
export interface RequestContext {
  traceId: string;
  userId?: number;
  caseId?: number;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function currentTraceId(): string {
  return requestContext.getStore()?.traceId ?? 'none';
}
