'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { GlobalBanners } from '@/components/layout/GlobalBanners';
import { Logo } from '@/components/layout/Logo';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { SkipLink } from '@/components/layout/SkipLink';
import { UserMenu } from '@/components/layout/UserMenu';

const CUSTOMER_ONLY = ['CUSTOMER'] as const;

/** Customer portal: mobile-first, centred 720 px column. */
export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard roles={CUSTOMER_ONLY}>
      <SkipLink />
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-content items-center justify-between gap-2 px-4 py-2">
          <Link href="/transactions" className="rounded-sm">
            <Logo />
          </Link>
          <UserMenu />
        </div>
      </header>
      <main id="main" className="mx-auto flex max-w-content flex-col gap-4 px-4 py-6">
        <GlobalBanners />
        {children}
      </main>
    </RouteGuard>
  );
}
