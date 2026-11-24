'use client';

import type { InputHTMLAttributes } from 'react';
import { Field, controlClass } from './Field';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  helper?: string;
  error?: string;
}

export function Input({ label, helper, error, required, className, ...rest }: InputProps) {
  return (
    <Field label={label} helper={helper} error={error} required={required} className={className}>
      {({ inputId, describedBy, invalid }) => (
        <input
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={`${controlClass(invalid)} h-11`}
          {...rest}
        />
      )}
    </Field>
  );
}
