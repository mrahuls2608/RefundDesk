import { Archive, CircleCheck, CircleDot, CircleX, LoaderCircle, Sparkles, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { CaseStatus } from '@/lib/api/types';
import { STATUS_LABEL, type CustomerStatus } from '@/lib/labels';
import { cx } from './cx';

type Tone = 'info' | 'ai' | 'warning' | 'success' | 'danger' | 'neutral';

const TONE_CLASS: Record<Tone, string> = {
  info: 'bg-info-50 text-info-700',
  ai: 'bg-ai-50 text-ai-700',
  warning: 'bg-warning-50 text-warning-700',
  success: 'bg-success-50 text-success-700',
  danger: 'bg-danger-50 text-danger-700',
  neutral: 'bg-bg text-text-muted border border-border',
};

const STAFF: Record<CaseStatus, { tone: Tone; icon: LucideIcon }> = {
  OPEN: { tone: 'info', icon: CircleDot },
  INVESTIGATING: { tone: 'info', icon: LoaderCircle },
  PROPOSED: { tone: 'ai', icon: Sparkles },
  NEEDS_MANUAL_REVIEW: { tone: 'warning', icon: TriangleAlert },
  APPROVED: { tone: 'success', icon: CircleCheck },
  REJECTED: { tone: 'danger', icon: CircleX },
  REFUNDED: { tone: 'success', icon: CircleCheck },
  CLOSED: { tone: 'neutral', icon: Archive },
};

const CUSTOMER: Record<CustomerStatus, { tone: Tone; icon: LucideIcon }> = {
  'In review': { tone: 'info', icon: CircleDot },
  Approved: { tone: 'success', icon: CircleCheck },
  Refunded: { tone: 'success', icon: CircleCheck },
  Rejected: { tone: 'danger', icon: CircleX },
  Closed: { tone: 'neutral', icon: Archive },
};

export type StatusBadgeProps =
  | { audience: 'staff'; status: CaseStatus; className?: string }
  | { audience: 'customer'; status: CustomerStatus; className?: string };

/** Status is always icon + text, never colour alone. */
export function StatusBadge(props: StatusBadgeProps) {
  const { tone, icon: Icon } = props.audience === 'staff' ? STAFF[props.status] : CUSTOMER[props.status];
  const label = props.audience === 'staff' ? STATUS_LABEL[props.status] : props.status;
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-caption', TONE_CLASS[tone], props.className)}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function Tag({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-caption', TONE_CLASS[tone])}>{children}</span>;
}
