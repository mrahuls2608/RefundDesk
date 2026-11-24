import { Check } from 'lucide-react';
import { cx } from './cx';

export interface StepperStep {
  key: string;
  label: string;
  state: 'done' | 'current' | 'upcoming';
}

/**
 * Horizontal progress for a multi step process ("Step 2 of 4"). An ordered list with aria-current,
 * so screen readers hear position and state; the connector fill is decoration.
 */
export function Stepper({ steps, label = 'Progress' }: { steps: StepperStep[]; label?: string }) {
  const currentIndex = Math.max(0, steps.findIndex((s) => s.state === 'current'));
  const doneCount = steps.filter((s) => s.state === 'done').length;
  const position = steps.some((s) => s.state === 'current') ? currentIndex + 1 : doneCount;
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Step {position} of {steps.length}
      </p>
      <ol aria-label={label} className="flex items-start">
        {steps.map((step, index) => (
          <li key={step.key} aria-current={step.state === 'current' ? 'step' : undefined} className="relative flex flex-1 flex-col items-center text-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cx(
                  'absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 transition-colors duration-500 ease-out',
                  step.state === 'upcoming' ? 'bg-border' : 'bg-primary-600',
                )}
              />
            )}
            <span
              className={cx(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-[background-color,border-color,color,box-shadow] duration-500 ease-out',
                step.state === 'done' && 'border-primary-600 bg-primary-600 text-text-inverse',
                step.state === 'current' && 'border-primary-600 bg-surface text-primary-600 shadow-[0_0_0_4px_var(--color-primary-50)]',
                step.state === 'upcoming' && 'border-border bg-surface text-text-muted',
              )}
            >
              {step.state === 'done' ? <Check aria-hidden="true" className="h-4 w-4" /> : index + 1}
            </span>
            <span className={cx('mt-2 px-1 text-xs sm:text-sm', step.state === 'current' ? 'font-semibold text-text' : step.state === 'done' ? 'text-text' : 'text-text-muted')}>
              {step.label}
              <span className="sr-only">{step.state === 'done' ? ' (completed)' : step.state === 'upcoming' ? ' (not yet)' : ' (current)'}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
