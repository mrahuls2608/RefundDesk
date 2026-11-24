import { cx } from './cx';

/** Placeholder shaped like the final content. Hidden from assistive tech; pair with a status message. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx('animate-pulse rounded-sm bg-border', className)} />;
}

export function SkeletonList({ rows = 4, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
