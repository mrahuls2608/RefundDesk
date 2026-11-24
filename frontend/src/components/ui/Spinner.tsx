import { LoaderCircle } from 'lucide-react';
import { cx } from './cx';

export interface SpinnerProps {
  label?: string;
  className?: string;
}

/** Inline loading indicator with visually hidden text for screen readers. */
export function Spinner({ label = 'Loading', className }: SpinnerProps) {
  return (
    <span role="status" className={cx('inline-flex items-center', className)}>
      <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
