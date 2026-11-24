'use client';

import type { ElementType, ReactNode } from 'react';
import { cx } from '@/components/ui';
import { useInViewOnce } from '@/lib/motion';

export interface RevealProps {
  children: ReactNode;
  /** Stagger step in milliseconds, for groups entering together. */
  delay?: number;
  as?: ElementType;
  className?: string;
}

/**
 * Heavy, gentle fade up as content enters the viewport (800 ms, drawer curve).
 * Under reduced motion the global rule collapses the transition, so content simply appears.
 */
export function Reveal({ children, delay = 0, as: Tag = 'div', className }: RevealProps) {
  const [ref, inView] = useInViewOnce<HTMLElement>();
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
      className={cx(
        'transition-[opacity,transform,filter] duration-[800ms] ease-drawer motion-reduce:transform-none motion-reduce:blur-0',
        inView ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-16 opacity-0 blur-md',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
