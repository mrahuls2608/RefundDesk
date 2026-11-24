import { Circle, CircleCheck, CircleDot } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import { cx } from './cx';

export interface TimelineStep {
  key: string;
  label: string;
  state: 'done' | 'current' | 'upcoming';
  at?: string;
  actor?: string;
}

export interface StatusTimelineProps {
  steps: TimelineStep[];
  label?: string;
}

/** Ordered list with aria-current="step" on the current step (TRD §9.3). */
export function StatusTimeline({ steps, label = 'Case progress' }: StatusTimelineProps) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {steps.map((step, index) => {
        const Icon = step.state === 'done' ? CircleCheck : step.state === 'current' ? CircleDot : Circle;
        return (
          <li key={step.key} aria-current={step.state === 'current' ? 'step' : undefined} className="relative flex gap-3 pb-4 last:pb-0">
            {index < steps.length - 1 && (
              <span aria-hidden="true" className={cx('absolute left-[9px] top-6 h-[calc(100%-1.25rem)] w-px', step.state === 'upcoming' ? 'bg-border' : 'bg-primary-600')} />
            )}
            <Icon
              aria-hidden="true"
              className={cx('relative mt-0.5 h-5 w-5 shrink-0', step.state === 'upcoming' ? 'text-border-strong' : 'text-primary-600', step.state === 'current' && 'fill-primary-50')}
            />
            <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
              <span className={cx('text-body', step.state === 'current' && 'font-semibold', step.state === 'upcoming' && 'text-text-muted')}>
                {step.label}
                {step.state === 'done' && <span className="sr-only"> (completed)</span>}
                {step.state === 'upcoming' && <span className="sr-only"> (not yet)</span>}
              </span>
              {(step.at || step.actor) && (
                <span className="text-small text-text-muted">
                  {step.at && <time dateTime={step.at}>{formatDateTime(step.at)}</time>}
                  {step.actor && <> · by {step.actor}</>}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
