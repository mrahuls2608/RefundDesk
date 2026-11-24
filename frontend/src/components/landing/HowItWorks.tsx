'use client';

import { BadgeCheck, MessageSquareWarning, Sparkles, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cx } from '@/components/ui';

interface Step {
  title: string;
  body: string;
  detail: string;
  icon: LucideIcon;
  states: string[];
}

const STEPS: Step[] = [
  {
    title: 'The customer reports the problem',
    body: 'They pick the payment from their history and choose what went wrong: charged twice, failed but debited, wrong amount or something else.',
    detail: 'One open case per transaction, enforced by a unique index.',
    icon: MessageSquareWarning,
    states: ['Received'],
  },
  {
    title: 'The AI investigates, read only',
    body: 'Within seconds the agent pulls 30 days of history and the matching policy, then proposes full refund, partial refund or reject with cited reasons and a confidence score.',
    detail: 'At most 3 model calls. Any failure goes to manual review, never to a refund.',
    icon: Sparkles,
    states: ['Received', 'Investigating', 'Proposed'],
  },
  {
    title: 'A person decides, the money moves once',
    body: 'An approver checks the facts, edits the amount if needed and approves with a comment. The refund runs through one idempotency key and the case closes with a full audit trail.',
    detail: 'Amount can never exceed the original charge. Double clicks return the first result.',
    icon: BadgeCheck,
    states: ['Received', 'Investigating', 'Proposed', 'Approved', 'Refunded'],
  },
];

/** Sticky storytelling: the left panel stays pinned while the step under the reading line becomes active. */
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    stepRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const current = STEPS[active]!;
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="mb-16 max-w-[680px]">
        <p className="mb-3 text-sm font-semibold text-primary-600">How it works</p>
        <h2 id="how-title" className="text-3xl font-semibold tracking-tight text-text text-balance sm:text-4xl">
          From complaint to closed case in three steps
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div aria-hidden="true" className="hidden lg:block">
          <div className="sticky top-32 rounded-2xl border border-border bg-surface p-8 shadow-sm">
            <current.icon key={active} className="mb-6 h-8 w-8 animate-fade-up text-primary-600" />
            <p className="tabular mb-2 text-sm font-semibold text-text-muted">Step {active + 1} of {STEPS.length}</p>
            <ol className="flex flex-col gap-3">
              {STEPS[STEPS.length - 1]!.states.map((state) => {
                const reached = current.states.includes(state);
                const isCurrent = current.states.at(-1) === state;
                return (
                  <li key={state} className="flex items-center gap-3">
                    <span
                      className={cx(
                        'h-3 w-3 rounded-full border-2 transition-colors duration-500 ease-out',
                        reached ? 'border-primary-600 bg-primary-600' : 'border-border-strong bg-transparent',
                      )}
                    />
                    <span
                      className={cx(
                        'text-base transition-[color,transform] duration-500 ease-out',
                        isCurrent ? 'translate-x-1 font-semibold text-text' : reached ? 'text-text' : 'text-text-muted',
                      )}
                    >
                      {state}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
        <ol className="flex flex-col gap-16 lg:gap-48 lg:py-24">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              data-index={index}
              ref={(node) => {
                stepRefs.current[index] = node;
              }}
              className={cx('transition-opacity duration-500 ease-out', active === index ? 'lg:opacity-100' : 'lg:opacity-40')}
            >
              <p className="tabular mb-3 text-sm font-semibold text-primary-600">0{index + 1}</p>
              <h3 className="mb-3 text-2xl font-semibold text-text text-balance">{step.title}</h3>
              <p className="mb-4 text-lg text-text-muted text-pretty">{step.body}</p>
              <p className="text-sm text-text text-pretty">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
