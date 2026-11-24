import { Receipt } from 'lucide-react';
import { cx } from '@/components/ui';

export function Logo({ tone = 'light' }: { tone?: 'light' | 'forest' }) {
  return (
    <span className={cx('inline-flex items-center gap-2 text-h3', tone === 'forest' ? 'text-forest-on' : 'text-text')}>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-on">
        <Receipt aria-hidden="true" className="h-4 w-4" />
      </span>
      RefundDesk
    </span>
  );
}
