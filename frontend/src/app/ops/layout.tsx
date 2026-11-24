'use client';

import { FileText, LogOut, Menu, Shield, X, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { GlobalBanners } from '@/components/layout/GlobalBanners';
import { Logo } from '@/components/layout/Logo';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { SkipLink } from '@/components/layout/SkipLink';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Avatar, cx } from '@/components/ui';
import type { CaseFilters } from '@/lib/api/endpoints';
import { useCases } from '@/lib/api/hooks';
import { STAFF_ROLES, useAuth } from '@/lib/auth/AuthProvider';

const ROLE_LABEL = { CUSTOMER: 'Customer', OPS: 'Ops agent', APPROVER: 'Approver', ADMIN: 'Admin' } as const;
const NEEDS_ACTION: CaseFilters = { status: ['PROPOSED', 'NEEDS_MANUAL_REVIEW'], size: 1 };

/** Ops console: forest sidebar with live queue count (desktop), collapsible top bar (mobile). */
export default function OpsLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <RouteGuard roles={STAFF_ROLES}>
      <SkipLink />
      <div className="lg:flex">
        <aside className="hidden w-sidebar shrink-0 flex-col bg-forest-900 text-forest-on lg:fixed lg:inset-y-0 lg:flex">
          <div className="px-5 py-5">
            <Link href="/" aria-label="RefundDesk home" className="rounded-md">
              <Logo tone="forest" />
            </Link>
          </div>
          <OpsNav />
          <SidebarUser />
        </aside>
        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[240px]">
          <header className="sticky top-0 z-30 border-b border-forest-line bg-forest-900 text-forest-on lg:hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-2">
              <Logo tone="forest" />
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
            </div>
            {menuOpen && (
              <div id="ops-mobile-nav" className="border-t border-forest-line pb-2">
                <OpsNav onNavigate={() => setMenuOpen(false)} />
                <SidebarUser />
              </div>
            )}
          </header>
          <main id="main" className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-10 lg:py-8">
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
  const needsAction = useCases(NEEDS_ACTION).data?.total;
  const items: { href: string; label: string; icon: LucideIcon; active: boolean; count?: number }[] = [
    { href: '/ops', label: 'Cases', icon: FileText, active: pathname === '/ops' || pathname.startsWith('/ops/cases'), count: needsAction },
    ...(user?.role === 'ADMIN' ? [{ href: '/ops/admin', label: 'Admin', icon: Shield, active: pathname.startsWith('/ops/admin') }] : []),
  ];
  return (
    <nav aria-label="Ops console" className="flex-1">
      <p className="px-5 pb-2 text-xs font-semibold uppercase tracking-wider text-forest-muted">Workspace</p>
      <ul className="flex flex-col gap-1 px-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={item.active ? 'page' : undefined}
              className={cx(
                'flex min-h-touch items-center gap-3 rounded-lg px-3 text-body transition-colors duration-150 ease-out',
                item.active ? 'bg-forest-800 font-semibold text-forest-on' : 'text-forest-muted hover:bg-forest-800 hover:text-forest-on',
              )}
            >
              <item.icon aria-hidden="true" className={cx('h-4 w-4', item.active && 'text-accent')} />
              <span className="flex-1">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="tabular rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-on">
                  {item.count}
                  <span className="sr-only"> cases need action</span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SidebarUser() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="m-3 rounded-xl border border-forest-line bg-forest-950 p-3">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-forest-on">{user.name}</p>
          <p className="truncate text-xs text-forest-muted">{ROLE_LABEL[user.role]}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-forest-line pt-2 [&_button:hover]:bg-forest-800 [&_button:hover]:text-forest-on [&_button]:text-forest-muted">
        <ThemeToggle />
        <button type="button" onClick={logout} className="inline-flex min-h-touch items-center gap-2 rounded-md px-3 text-sm">
          <LogOut aria-hidden="true" className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}
