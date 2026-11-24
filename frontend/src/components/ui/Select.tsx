'use client';

import type { SelectHTMLAttributes } from 'react';
import { Field, controlClass } from './Field';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  options: SelectOption[];
  helper?: string;
  error?: string;
}

export function Select({ label, options, helper, error, required, className, ...rest }: SelectProps) {
  return (
    <Field label={label} helper={helper} error={error} required={required} className={className}>
      {({ inputId, describedBy, invalid }) => (
        <select
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={`${controlClass(invalid)} h-11`}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
