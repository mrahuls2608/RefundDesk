'use client';

import { useEffect, useState } from 'react';
import { useInViewOnce, useReducedMotion } from '@/lib/motion';
import { Reveal } from './Reveal';

const STATS = [
  { value: 96, label: 'integration tests against real MongoDB and Redis' },
  { value: 65, label: 'role access checks, every endpoint against every role' },
  { value: 22, label: 'labelled cases in the agent eval suite' },
  { value: 0, label: 'duplicate refunds, however fast you click' },
];

const COUNT_MS = 1200;

/** Proof from the CI pipeline, counted up once when it scrolls into view. */
export function Stats() {
  return (
    <section aria-label="Verified on every build" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="rounded-2xl border border-border bg-surface p-8 shadow-sm sm:p-12">
        <p className="mb-8 text-sm font-semibold text-primary-600">Verified on every build</p>
        <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2">
              <dt className="order-2 text-sm text-text-muted text-pretty">{stat.label}</dt>
              <dd className="order-1 text-5xl font-semibold tracking-tight text-text">
                <CountUp to={stat.value} />
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

function CountUp({ to }: { to: number }) {
  const reduced = useReducedMotion();
  const [ref, inView] = useInViewOnce<HTMLSpanElement>();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(to * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, to]);

  return (
    <span ref={ref} className="tabular">
      {reduced ? to : value}
    </span>
  );
}
