'use client';

import type { TextareaHTMLAttributes } from 'react';
import { Field, controlClass } from './Field';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'value'> {
  label: string;
  value: string;
  maxLength: number;
  helper?: string;
  error?: string;
}

const NEAR_LIMIT_RATIO = 0.9;

/** Shows "n / max"; the counter is announced politely only once the text is near the limit. */
export function Textarea({ label, value, maxLength, helper, error, required, className, rows = 4, ...rest }: TextareaProps) {
  const nearLimit = value.length >= maxLength * NEAR_LIMIT_RATIO;
  return (
    <Field
      label={label}
      helper={helper}
      error={error}
      required={required}
      className={className}
      aside={
        <span className="tabular text-small text-text-muted" aria-live={nearLimit ? 'polite' : 'off'}>
          {value.length} / {maxLength}
        </span>
      }
    >
      {({ inputId, describedBy, invalid }) => (
        <textarea
          id={inputId}
          value={value}
          maxLength={maxLength}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={`${controlClass(invalid)} py-2`}
          {...rest}
        />
      )}
    </Field>
  );
}
