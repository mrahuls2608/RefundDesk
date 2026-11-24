'use client';

import { FileText, Menu, Shield, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { GlobalBanners } from '@/components/layout/GlobalBanners';
import { Logo } from '@/components/layout/Logo';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { SkipLink } from '@/components/layout/SkipLink';
import { UserMenu } from '@/components/layout/UserMenu';
import { cx } from '@/components/ui';
import { STAFF_ROLES, useAuth } from '@/lib/auth/AuthProvider';

/** Ops console: fixed 240 px sidebar on desktop, collapsible top bar on mobile. */
export default function OpsLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <RouteGuard roles={STAFF_ROLES}>
      <SkipLink />
      <div className="lg:flex">
        <aside className="hidden w-sidebar shrink-0 border-r border-border bg-surface lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
          <div className="px-4 py-4">
            <Logo />
          </div>
          <OpsNav />
        </aside>
        <div className="flex min-h-screen flex-1 flex-col lg:pl-[240px]">
          <header className="sticky top-0 z-30 border-b border-border bg-surface">
            <div className="flex items-center justify-between gap-2 px-4 py-2">
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  aria-controls="ops-mobile-nav"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  onClick={() => setMenuOpen((open) => !open)}
                  className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md"
                >
                  {menuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
                </button>
                <Logo />
              </div>
              <span className="hidden lg:block" />
              <UserMenu showRole />
            </div>
            {menuOpen && (
              <div id="ops-mobile-nav" className="border-t border-border lg:hidden">
                <OpsNav onNavigate={() => setMenuOpen(false)} />
              </div>
            )}
          </header>
          <main id="main" className="flex flex-1 flex-col gap-4 px-4 py-6 lg:px-8">
            <GlobalBanners />
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}

function OpsNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = [
    { href: '/ops', label: 'Cases', icon: FileText, active: pathname === '/ops' || pathname.startsWith('/ops/cases') },
    ...(user?.role === 'ADMIN' ? [{ href: '/ops/admin', label: 'Admin', icon: Shield, active: pathname.startsWith('/ops/admin') }] : []),
  ];
  return (
    <nav aria-label="Ops console">
      <ul className="flex flex-col gap-1 p-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={item.active ? 'page' : undefined}
              className={cx(
                'flex min-h-touch items-center gap-2 rounded-md px-3 text-body',
                item.active ? 'bg-primary-50 font-semibold text-primary-700' : 'text-text hover:bg-primary-50',
              )}
            >
              <item.icon aria-hidden="true" className="h-4 w-4" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
