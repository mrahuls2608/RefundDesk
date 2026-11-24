import type { ReactNode } from 'react';
import type { TransactionStatus } from '@/lib/api/types';
import { formatDateTime, formatINR } from '@/lib/format';
import { Tag } from './StatusBadge';

export interface TransactionRowProps {
  merchant: string;
  amount: number;
  createdAt: string;
  status: TransactionStatus;
  hasOpenCase: boolean;
  /** The only interactive element (a link or button); the row itself is not clickable. */
  action: ReactNode;
}

const STATUS_TEXT: Record<TransactionStatus, { label: string; tone: 'success' | 'danger' | 'warning' }> = {
  SUCCESS: { label: 'Success', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
  PENDING: { label: 'Pending', tone: 'warning' },
};

export function TransactionRow({ merchant, amount, createdAt, status, hasOpenCase, action }: TransactionRowProps) {
  const statusText = STATUS_TEXT[status];
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow duration-200 ease-out hover:shadow-lg sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-base font-semibold text-primary-700">
          {merchant.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-h3">{merchant}</p>
          <p className="text-small text-text-muted">
            <time dateTime={createdAt}>{formatDateTime(createdAt)}</time>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="tabular text-base font-semibold">{formatINR(amount)}</span>
          <span className="flex gap-1">
            <Tag tone={statusText.tone}>{statusText.label}</Tag>
            {hasOpenCase && <Tag tone="info">Case open</Tag>}
          </span>
        </div>
        {action}
      </div>
    </div>
  );
}
