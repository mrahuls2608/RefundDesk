import type { ReactNode } from 'react';
import { cx } from './cx';

export function Card({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cx('rounded-md border border-border bg-surface p-4 shadow-sm', className)} aria-label={title}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-h3">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
