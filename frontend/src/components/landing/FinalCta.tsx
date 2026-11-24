'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cx } from '@/components/ui';
import { useInViewOnce } from '@/lib/motion';

const LINE_LENGTH = 600;

/** Forest panel with lime circuit lines that draw themselves when the section arrives. */
export function FinalCta() {
  const [ref, inView] = useInViewOnce<HTMLDivElement>();
  return (
    <section aria-labelledby="cta-title" className="px-2 py-12 sm:px-4">
      <div ref={ref} className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl bg-forest-900 px-6 py-20 text-center text-forest-on sm:px-12">
        <svg aria-hidden="true" viewBox="0 0 1200 400" preserveAspectRatio="none" className="absolute inset-0 -z-10 h-full w-full">
          {['M0 320 H260 L320 260 H520', 'M1200 80 H940 L880 140 H700', 'M0 60 H180 L230 110', 'M1200 340 H1010 L960 290'].map((d, index) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="var(--color-accent)"
              strokeOpacity="0.5"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeDasharray={LINE_LENGTH}
              strokeDashoffset={inView ? 0 : LINE_LENGTH}
              style={{ transition: `stroke-dashoffset 1600ms var(--ease-in-out) ${index * 150}ms` }}
            />
          ))}
        </svg>
        <span aria-hidden="true" className="absolute left-1/2 top-full -z-10 h-48 w-[32rem] -translate-x-1/2 -translate-y-1/2">
          <span className="block h-full w-full animate-glow rounded-full bg-accent opacity-20 blur-3xl" />
        </span>
        <div className={cx('mx-auto flex max-w-[680px] flex-col items-center gap-6 transition-[opacity,transform] duration-700 ease-drawer', inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0')}>
          <h2 id="cta-title" className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Ready to stop paying refunds twice?
          </h2>
          <p className="text-lg text-forest-muted text-pretty">
            Log in as Asha to report a charge, then as Priya to approve it. Free, open source and MIT licensed. Runs offline with no API key.
          </p>
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-base font-semibold text-accent-on shadow-glow transition-[transform,background-color] duration-150 ease-out hover:bg-accent-strong active:scale-[0.97]"
          >
            Try the live demo
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </Link>
          <p className="text-sm text-forest-muted">Password for every demo account: Demo@123</p>
        </div>
      </div>
    </section>
  );
}
