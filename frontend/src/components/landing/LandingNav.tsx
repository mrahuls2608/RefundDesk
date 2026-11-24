'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cx } from '@/components/ui';
import { homeFor, useAuth } from '@/lib/auth/AuthProvider';

export const NAV_SECTIONS = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'guarantees', label: 'Guarantees' },
  { id: 'try-it', label: 'Double click test' },
  { id: 'faq', label: 'FAQ' },
] as const;

const STAGGER_MS = 50;

/** Floating glass island. On mobile the hamburger morphs into an X and opens a full screen glass menu. */
export function LandingNav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cta = user ? { href: homeFor(user.role), label: 'Open your desk' } : { href: '/login', label: 'Try the demo' };

  const closeMenu = useCallback(() => setOpen(false), []);
  useMenuBehaviour(open, closeMenu, toggleRef, menuRef);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4">
      <nav
        aria-label="Main"
        className="pointer-events-auto relative z-50 mx-auto mt-6 flex w-max max-w-full items-center gap-2 rounded-full border border-border bg-glass py-2 pl-4 pr-2 shadow-lg backdrop-blur-xl"
      >
        <Link href="/" aria-label="RefundDesk home" className="rounded-full pr-2">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active === section.id ? 'location' : undefined}
                className={cx(
                  'inline-flex h-9 items-center rounded-full px-3 text-sm font-medium transition-colors duration-200 ease-out',
                  active === section.id ? 'bg-primary-50 text-primary-700' : 'text-text-muted hover:text-text',
                )}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
        <Link
          href={cta.href}
          className="hidden h-9 items-center rounded-full bg-primary-600 px-3 text-sm font-semibold text-text-inverse transition-[transform,background-color] duration-150 ease-out hover:bg-primary-700 active:scale-[0.97] sm:inline-flex"
        >
          {cta.label}
        </Link>
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls="landing-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
          className="relative z-50 inline-flex h-11 w-11 items-center justify-center rounded-full md:hidden"
        >
          <span
            aria-hidden="true"
            className={cx('absolute h-0.5 w-5 rounded-full bg-text transition-transform duration-700 ease-drawer', open ? 'rotate-45' : '-translate-y-1.5')}
          />
          <span
            aria-hidden="true"
            className={cx('absolute h-0.5 w-5 rounded-full bg-text transition-transform duration-700 ease-drawer', open ? '-rotate-45' : 'translate-y-1.5')}
          />
        </button>
      </nav>

      <div
        id="landing-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={cx(
          'fixed inset-0 z-40 flex flex-col justify-center gap-8 bg-overlay px-8 backdrop-blur-3xl transition-[opacity,visibility] duration-700 ease-drawer md:hidden',
          open ? 'pointer-events-auto visible opacity-100' : 'invisible opacity-0',
        )}
      >
        <ul className="flex flex-col gap-4">
          {[...NAV_SECTIONS, { id: 'cta', label: cta.label }].map((item, index) => (
            <li
              key={item.id}
              style={{ transitionDelay: open ? `${100 + index * STAGGER_MS}ms` : '0ms' }}
              className={cx('transition-[opacity,transform] duration-700 ease-drawer', open ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0')}
            >
              {item.id === 'cta' ? (
                <Link href={cta.href} onClick={() => setOpen(false)} className="text-3xl font-semibold text-primary-600">
                  {cta.label}
                </Link>
              ) : (
                <a href={`#${item.id}`} onClick={() => setOpen(false)} className="text-3xl font-semibold text-text">
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <ThemeToggle />
      </div>
    </header>
  );
}

/** Highlights the section currently under the middle of the viewport. */
function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
          else setActive((current) => (current === entry.target.id ? null : current));
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    NAV_SECTIONS.forEach(({ id }) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

/** Esc closes, focus moves into the menu and is kept between the toggle and the links, body scroll locks. */
function useMenuBehaviour(
  open: boolean,
  close: () => void,
  toggleRef: React.RefObject<HTMLButtonElement | null>,
  menuRef: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const focusables = () => [toggleRef.current, ...Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a, button') ?? [])].filter(Boolean) as HTMLElement[];
    focusables()[1]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? (index <= 0 ? items.length - 1 : index - 1) : index === items.length - 1 ? 0 : index + 1;
      event.preventDefault();
      items[next]?.focus();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close, toggleRef, menuRef]);
}
