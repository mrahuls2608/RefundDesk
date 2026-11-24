'use client';

import { useEffect, useRef } from 'react';

/** Updates the document title and moves focus to the page h1 on route change (Design §10). */
export function usePageTitle(title: string) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = `${title} · RefundDesk`;
  }, [title]);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: false });
  }, []);
  return headingRef;
}
