'use client';

import { CircleAlert } from 'lucide-react';
import { useId } from 'react';
import { cx } from './cx';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
}

export interface RadioGroupProps<T extends string> {
  legend: string;
  name: string;
  options: RadioOption<T>[];
  value: T | '';
  onChange: (value: T) => void;
  error?: string;
  required?: boolean;
}

/** Native radios in a fieldset: arrow keys, labels and grouping come for free. */
export function RadioGroup<T extends string>({ legend, name, options, value, onChange, error, required }: RadioGroupProps<T>) {
  const errorId = useId();
  return (
    <fieldset aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined} className="flex flex-col gap-2">
      <legend className="mb-1 text-small font-medium text-text">
        {legend}
        {required && <span className="text-text-muted"> (required)</span>}
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={cx(
            'flex min-h-touch cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors duration-fast',
            value === option.value ? 'border-primary-600 bg-primary-50' : 'border-border bg-surface hover:border-border-strong',
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            required={required}
            className="h-4 w-4 accent-primary-600"
          />
          <span className="text-body">{option.label}</span>
        </label>
      ))}
      {error && (
        <p id={errorId} className="flex items-center gap-1 text-small text-danger-700">
          <CircleAlert aria-hidden="true" className="h-4 w-4" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
