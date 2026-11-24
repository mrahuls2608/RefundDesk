'use client';

import { CircleAlert } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cx } from './cx';

export interface FieldIds {
  inputId: string;
  describedBy: string | undefined;
  invalid: boolean;
}

export interface FieldProps {
  label: string;
  helper?: ReactNode;
  error?: string;
  required?: boolean;
  /** Extra content rendered next to the helper, e.g. a character counter. */
  aside?: ReactNode;
  children: (ids: FieldIds) => ReactNode;
  className?: string;
}

/** Label above, helper below; an error replaces the helper and is linked via aria-describedby. */
export function Field({ label, helper, error, required, aside, children, className }: FieldProps) {
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const hasMessage = Boolean(error || helper);
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label htmlFor={inputId} className="text-small font-medium text-text">
        {label}
        {required && <span className="text-text-muted"> (required)</span>}
      </label>
      {children({ inputId, describedBy: hasMessage ? messageId : undefined, invalid: Boolean(error) })}
      {(hasMessage || aside) && (
        <div className="flex items-start justify-between gap-2">
          {error ? (
            <p id={messageId} className="flex items-center gap-1 text-small text-danger-700">
              <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : helper ? (
            <p id={messageId} className="text-small text-text-muted">
              {helper}
            </p>
          ) : (
            <span />
          )}
          {aside}
        </div>
      )}
    </div>
  );
}

export const controlClass = (invalid: boolean) =>
  cx(
    'w-full rounded-sm border bg-surface px-3 text-body text-text transition-colors duration-fast',
    'hover:border-border-strong disabled:opacity-50',
    invalid ? 'border-danger-700' : 'border-border',
  );
