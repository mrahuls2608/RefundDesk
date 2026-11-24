'use client';

import { BadgeCheck, Landmark, MessageSquareWarning, Sparkles, UserCheck, type LucideIcon } from 'lucide-react';
import { cx } from '@/components/ui';
import { useInViewOnce } from '@/lib/motion';

interface Step {
  title: string;
  body: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  { title: 'Report', body: 'The customer picks a payment and says what went wrong.', icon: MessageSquareWarning },
  { title: 'Investigate', body: 'Within seconds the agent reads history and policy, read only.', icon: Sparkles },
  { title: 'Propose', body: 'Full, partial or reject, with reasons and a confidence score.', icon: BadgeCheck },
  { title: 'Approve', body: 'A person checks the facts and decides, with a comment.', icon: UserCheck },
  { title: 'Refund once', body: 'One idempotent refund, a closed case and a full audit trail.', icon: Landmark },
];

const STEP_STAGGER_MS = 140;

/** The reference's "ideas to revenue" strip: the connector draws left to right, then the steps arrive in order. */
export function ProcessLine() {
  const [ref, inView] = useInViewOnce<HTMLDivElement>('0px 0px -20% 0px');
  return (
    <section id="how-it-works" aria-labelledby="process-title" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="mx-auto mb-16 max-w-[680px] text-center">
        <p className="mb-3 text-sm font-semibold text-primary-600">How it works</p>
        <h2 id="process-title" className="text-3xl font-semibold tracking-tight text-text text-balance sm:text-5xl">
          From complaint to refund in one system
        </h2>
      </div>
      <div ref={ref} className="relative">
        <span aria-hidden="true" className="absolute left-[10%] right-[10%] top-6 hidden h-0.5 bg-border lg:block" />
        <span
          aria-hidden="true"
          className={cx(
            'absolute left-[10%] right-[10%] top-6 hidden h-0.5 origin-left bg-accent transition-transform duration-[1400ms] ease-in-out lg:block',
            inView ? 'scale-x-100' : 'scale-x-0',
          )}
        />
        <ol className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, index) => {
            const last = index === STEPS.length - 1;
            return (
              <li
                key={step.title}
                style={{ transitionDelay: inView ? `${300 + index * STEP_STAGGER_MS}ms` : '0ms' }}
                className={cx(
                  'flex flex-col items-center text-center transition-[opacity,transform,filter] duration-700 ease-drawer',
                  inView ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-8 opacity-0 blur-sm',
                )}
              >
                <span
                  className={cx(
                    'relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm',
                    last ? 'border-accent bg-accent text-accent-on shadow-glow' : 'border-border bg-surface text-primary-600',
                  )}
                >
                  <step.icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div className={cx('w-full rounded-2xl border p-4', last ? 'border-accent bg-primary-50' : 'border-border bg-surface')}>
                  <p className="tabular mb-1 text-xs font-semibold text-text-muted">Step {index + 1}</p>
                  <h3 className="mb-1 text-lg font-semibold text-text">{step.title}</h3>
                  <p className="text-sm text-text-muted text-pretty">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
