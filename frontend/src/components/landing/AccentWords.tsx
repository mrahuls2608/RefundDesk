'use client';

import type { ReactNode } from 'react';
import { cx } from '@/components/ui';
import { useInViewOnce } from '@/lib/motion';

/**
 * Highlighted words inside a heading: a lime marker sweeps in behind the text when it scrolls into view.
 * On forest panels the words turn lime instead.
 */
export function AccentWords({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'forest' }) {
  const [ref, inView] = useInViewOnce<HTMLSpanElement>();
  if (tone === 'forest') return <span className="text-accent">{children}</span>;
  return (
    <span ref={ref} className="relative inline-block whitespace-nowrap px-1">
      <span
        aria-hidden="true"
        className={cx(
          'absolute inset-x-0 bottom-1 top-1/2 -z-0 origin-left rounded-sm bg-accent transition-transform delay-300 duration-700 ease-drawer',
          inView ? 'scale-x-100' : 'scale-x-0',
        )}
      />
      <span className="relative">{children}</span>
    </span>
  );
}
