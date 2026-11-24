import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from './cx';

export type BannerVariant = 'info' | 'success' | 'warning' | 'danger';

export interface BannerProps {
  variant: BannerVariant;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

const STYLE: Record<BannerVariant, string> = {
  info: 'border-info-700 bg-info-50 text-info-700',
  success: 'border-success-700 bg-success-50 text-success-700',
  warning: 'border-warning-700 bg-warning-50 text-warning-700',
  danger: 'border-danger-700 bg-danger-50 text-danger-700',
};

const ICON = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert };

/** Errors use role="alert" (interrupting); everything else role="status" (polite). */
export function Banner({ variant, children, action, className }: BannerProps) {
  const Icon = ICON[variant];
  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cx('flex items-start gap-3 rounded-md border px-4 py-3 text-body', STYLE[variant], className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 text-text">{children}</div>
      {action}
    </div>
  );
}
