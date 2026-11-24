'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from '@/components/ui';
import { useReducedMotion } from '@/lib/motion';

const LINES = ['The AI does the digging.', 'A person makes the call.', 'The money moves once.'];
const WORDS = LINES.map((line) => line.split(' '));
/** A word lights up once its top crosses this fraction of the viewport height. */
const TRIGGER_LINE = 0.62;

/**
 * Each word moves from a muted tone to full colour, in reading order, as it crosses a trigger line.
 * One passive scroll listener, throttled through requestAnimationFrame.
 */
export function TaglineReveal() {
  const reduced = useReducedMotion();
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [litCount, setLitCount] = useState(0);
  const total = WORDS.flat().length;

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const trigger = window.innerHeight * TRIGGER_LINE;
      const lit = wordRefs.current.filter((node) => node && node.getBoundingClientRect().top < trigger).length;
      setLitCount(lit);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  let index = 0;
  return (
    <section aria-label="What RefundDesk stands for" className="mx-auto flex max-w-6xl justify-center px-4 py-24 sm:px-6 lg:py-32">
      <p className="max-w-[680px] text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
        {WORDS.map((words, lineIndex) => (
          <span key={LINES[lineIndex]} className="block sm:whitespace-nowrap">
            {words.map((word) => {
              const position = index++;
              const lit = reduced || position < litCount;
              return (
                <span
                  key={`${word}-${position}`}
                  ref={(node) => {
                    wordRefs.current[position] = node;
                  }}
                  className={cx('inline-block text-text transition-opacity duration-700 ease-drawer', lit ? 'opacity-100' : 'opacity-30')}
                >
                  {word}
                  {position < total - 1 && ' '}
                </span>
              );
            })}
          </span>
        ))}
      </p>
    </section>
  );
}
