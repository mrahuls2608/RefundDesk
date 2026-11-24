import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode, ThHTMLAttributes } from 'react';
import { cx } from './cx';

export type SortDirection = 'ascending' | 'descending' | 'none';
export type Density = 'comfortable' | 'compact';

export function Table({ caption, children, density = 'comfortable' }: { caption: string; children: ReactNode; density?: Density }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface shadow-sm">
      <table className={cx('w-full border-collapse text-left text-body', density === 'compact' ? '[&_td]:h-10' : '[&_td]:h-12')}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, align = 'left', ...rest }: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={cx('sticky top-0 border-b border-border bg-surface px-3 py-2 text-small font-medium text-text-muted', align === 'right' && 'text-right', className)}
      {...rest}
    />
  );
}

export interface SortableThProps {
  label: string;
  direction: SortDirection;
  onSort: () => void;
  align?: 'left' | 'right';
}

/** Sortable header: a real button inside the th, with aria-sort on the th. */
export function SortableTh({ label, direction, onSort, align }: SortableThProps) {
  const Icon = direction === 'ascending' ? ChevronUp : direction === 'descending' ? ChevronDown : ChevronsUpDown;
  return (
    <Th aria-sort={direction} align={align}>
      <button type="button" onClick={onSort} className="inline-flex items-center gap-1 rounded-sm font-medium hover:text-text">
        {label}
        <Icon aria-hidden="true" className="h-4 w-4" />
      </button>
    </Th>
  );
}

export function Td({ children, align = 'left', className }: { children: ReactNode; align?: 'left' | 'right'; className?: string }) {
  return <td className={cx('border-b border-border px-3', align === 'right' && 'tabular text-right', className)}>{children}</td>;
}
