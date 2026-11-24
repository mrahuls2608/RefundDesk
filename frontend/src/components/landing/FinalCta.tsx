import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Reveal } from './Reveal';

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-sm sm:px-12">
        <h2 id="cta-title" className="max-w-[680px] text-3xl font-semibold tracking-tight text-text text-balance sm:text-5xl">
          See a dispute go from complaint to refund in under a minute
        </h2>
        <p className="max-w-[680px] text-lg text-text-muted text-pretty">
          Log in as Asha to report a charge, then as Priya to approve it. Free, open source and MIT licensed. Runs offline with no API key.
        </p>
        <Link
          href="/login"
          className="group inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-base font-semibold text-text-inverse shadow-sm transition-[transform,background-color] duration-150 ease-out hover:bg-primary-700 active:scale-[0.97]"
        >
          Try the live demo
          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
        </Link>
        <p className="text-sm text-text-muted">Password for every demo account: Demo@123</p>
      </Reveal>
    </section>
  );
}
