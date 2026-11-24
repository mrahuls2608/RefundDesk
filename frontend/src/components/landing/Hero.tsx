import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { HeroDemo } from './HeroDemo';

/** Broken where the thought breaks, not where the column happens to end. */
const HEADLINE_LINES = ['Payment disputes', 'resolved in minutes.', 'Every refund', 'paid exactly once.'];
const LINE_STAGGER_MS = 80;

/** Above the fold: outcome headline, how it works in one line, one CTA, one proof signal, the product itself. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-4 pb-24 pt-40 sm:px-6 lg:grid-cols-2 lg:pt-48">
      <div className="flex min-w-0 flex-col items-start gap-6">
        <p className="inline-flex animate-rise items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-success-700" />
          AI investigates · humans approve · money moves once
        </p>
        <h1 id="hero-title" className="w-full max-w-[680px] text-3xl font-semibold tracking-tight min-[400px]:text-4xl sm:text-5xl xl:text-6xl">
          {HEADLINE_LINES.map((line, index) => (
            <span
              key={line}
              style={{ animationDelay: `${100 + index * LINE_STAGGER_MS}ms` }}
              className="block animate-rise bg-[linear-gradient(90deg,var(--color-hero-from),var(--color-hero-to))] w-max max-w-full bg-clip-text pb-1 text-transparent"
            >
              {line}
            </span>
          ))}
        </h1>
        <p style={{ animationDelay: '420ms' }} className="max-w-[680px] animate-rise text-lg text-text-muted text-pretty">
          RefundDesk gives support teams an AI investigator that gathers the facts and proposes an outcome, while a person approves every
          rupee. Refunds run through one idempotent path, so a double click can never pay twice.
        </p>
        <div style={{ animationDelay: '500ms' }} className="flex animate-rise flex-col items-start gap-3">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-base font-semibold text-text-inverse shadow-sm transition-[transform,background-color] duration-150 ease-out hover:bg-primary-700 active:scale-[0.97]"
          >
            Try the live demo
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </Link>
          <p className="text-sm text-text-muted">No signup. Five demo accounts, one password.</p>
        </div>
        <p style={{ animationDelay: '580ms' }} className="animate-rise text-sm text-text-muted text-pretty">
          <span className="tabular font-semibold text-text">0 duplicate refunds</span> from 10 parallel approvals, checked on every CI run.
        </p>
      </div>
      <div style={{ animationDelay: '300ms' }} className="min-w-0 animate-rise">
        <HeroDemo />
      </div>
    </section>
  );
}
