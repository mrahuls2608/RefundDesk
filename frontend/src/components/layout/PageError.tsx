import { Banner, Button } from '@/components/ui';
import { ApiError } from '@/lib/api/http';

/** Error state for data views: message, retry and (for ops) the trace id. */
export function PageError({ error, onRetry, showTraceId = false }: { error: unknown; onRetry: () => void; showTraceId?: boolean }) {
  const apiError = error instanceof ApiError ? error : null;
  return (
    <Banner
      variant="danger"
      action={
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      }
    >
      <p>{apiError?.message ?? 'Something went wrong while loading this page.'}</p>
      {showTraceId && apiError?.traceId && <p className="text-caption text-text-muted">Trace ID: {apiError.traceId}</p>}
    </Banner>
  );
}
