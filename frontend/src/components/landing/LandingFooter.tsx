'use client';

import Link from 'next/link';
import { cx } from '@/components/ui';
import { Logo } from '@/components/layout/Logo';
import { useInViewOnce } from '@/lib/motion';
import { NAV_SECTIONS } from './LandingNav';

const REPO_URL = 'https://github.com/mrahuls2608/refunddesk';

const linkClass = 'text-sm text-forest-muted transition-colors duration-150 hover:text-accent';

export function LandingFooter() {
  const [ref, inView] = useInViewOnce<HTMLParagraphElement>('0px');
  return (
    <footer className="px-2 pb-2 sm:px-4 sm:pb-4">
      <div className="relative overflow-hidden rounded-3xl bg-forest-950 text-forest-on">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 pb-12 pt-16 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
            <Logo tone="forest" />
            <p className="text-sm text-forest-muted text-pretty">AI investigates, humans approve, money moves once. Mock data only.</p>
          </div>
          <FooterColumn title="Product">
            {NAV_SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className={linkClass}>
                  {section.label}
                </a>
              </li>
            ))}
          </FooterColumn>
          <FooterColumn title="Project">
            <li>
              <a href={REPO_URL} className={linkClass}>
                Source code
              </a>
            </li>
            <li>
              <Link href="/login" className={linkClass}>
                Live demo
              </Link>
            </li>
          </FooterColumn>
          <FooterColumn title="Legal">
            <li>
              <Link href="/privacy" className={linkClass}>
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className={linkClass}>
                Terms
              </Link>
            </li>
          </FooterColumn>
        </div>
        <p
          ref={ref}
          aria-hidden="true"
          className={cx(
            'select-none whitespace-nowrap bg-[linear-gradient(90deg,var(--color-accent),var(--color-on-forest-muted))] bg-clip-text px-4 text-center text-6xl font-bold leading-none tracking-tighter text-transparent transition-[opacity,transform] duration-1000 ease-drawer sm:text-8xl lg:text-9xl',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-1/2 opacity-0',
          )}
        >
          refunddesk
        </p>
        <p className="mx-auto max-w-6xl px-6 pb-8 pt-6 text-xs text-forest-muted">© 2026 RefundDesk · MIT licensed</p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title}>
      <p className="mb-3 text-sm font-semibold text-forest-on">{title}</p>
      <ul className="flex flex-col gap-2">{children}</ul>
    </nav>
  );
}
