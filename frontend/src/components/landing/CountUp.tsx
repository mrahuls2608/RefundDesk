'use client';

import { useEffect, useState } from 'react';
import { useInViewOnce, useReducedMotion } from '@/lib/motion';

const COUNT_MS = 1200;

/** Counts up once when visible. Reduced motion shows the final number straight away. */
export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const reduced = useReducedMotion();
  const [ref, inView] = useInViewOnce<HTMLSpanElement>();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_MS);
      setValue(Math.round(to * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, to]);

  return (
    <span ref={ref} className="tabular">
      {reduced ? to : value}
      {suffix}
    </span>
  );
}
