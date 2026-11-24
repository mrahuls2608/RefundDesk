'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReduced(callback: () => void) {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

/** True when the visitor asked for less motion. Server render assumes motion is fine. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false);
}

/**
 * Fires once when the element enters the viewport (IntersectionObserver, never a scroll listener).
 * Re-animating on every scroll-by would fight the reader.
 */
export function useInViewOnce<T extends Element>(rootMargin = '0px 0px -12% 0px'): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, inView]);
  return [ref, inView];
}

/** Tracks whether an element is currently on screen (used to pause loops that nobody is watching). */
export function useOnScreen<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}
