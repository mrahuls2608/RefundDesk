import { formatINR } from '@/lib/format';
import { cx } from './cx';

export type AmountCardVariant = 'neutral' | 'success' | 'muted';

export interface AmountCardProps {
  label: string;
  amount: number;
  caption?: string;
  variant?: AmountCardVariant;
}

const VARIANT: Record<AmountCardVariant, string> = {
  neutral: 'border-border bg-surface',
  success: 'border-success-700 bg-success-50',
  muted: 'border-border bg-bg',
};

export function AmountCard({ label, amount, caption, variant = 'neutral' }: AmountCardProps) {
  return (
    <section aria-label={label} className={cx('rounded-md border p-4 shadow-sm', VARIANT[variant])}>
      <p className="text-small text-text-muted">{label}</p>
      <p className={cx('tabular text-display', variant === 'success' ? 'text-success-700' : 'text-text', variant === 'muted' && 'line-through')}>
        {formatINR(amount)}
      </p>
      {variant === 'muted' && <p className="text-small font-medium text-danger-700">Not refunded</p>}
      {caption && <p className="text-small text-text-muted">{caption}</p>}
    </section>
  );
}
