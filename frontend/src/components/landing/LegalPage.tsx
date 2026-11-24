import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/layout/Logo';
import { SkipLink } from '@/components/layout/SkipLink';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
        <Link href="/" aria-label="RefundDesk home">
          <Logo />
        </Link>
        <Link href="/" className="text-sm font-semibold text-primary-600 hover:underline">
          Back to home
        </Link>
      </header>
      <main id="main" className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-24 pt-8 text-base text-text-muted sm:px-6 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text">
        <h1 className="text-4xl font-semibold tracking-tight text-text">{title}</h1>
        <p className="text-sm">Last updated {updated}</p>
        {children}
      </main>
    </>
  );
}
