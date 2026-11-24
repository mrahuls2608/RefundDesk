'use client';

import { BadgeCheck, Database, Landmark, MessageSquareWarning, Receipt, ScrollText, Sparkles, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cx } from '@/components/ui';
import { useOnScreen, useReducedMotion } from '@/lib/motion';
import { AccentWords } from './AccentWords';
import { HexPattern } from './HexPattern';
import { Reveal } from './Reveal';

interface FlowNode {
  label: string;
  detail: string;
  icon: LucideIcon;
}

const NODES: FlowNode[] = [
  { label: 'Report', detail: 'Customer picks the payment', icon: MessageSquareWarning },
  { label: 'History', detail: 'getTransactions, 30 days', icon: Database },
  { label: 'Policy', detail: 'getPolicy for the issue', icon: ScrollText },
  { label: 'Propose', detail: 'Validated JSON, cited reasons', icon: Sparkles },
  { label: 'Approve', detail: 'A person decides', icon: BadgeCheck },
  { label: 'Refund', detail: 'Paid once, fully audited', icon: Landmark },
];

const STEP_MS = 1400;
/** Nodes sit on the lower half of an ellipse around the pedestal (percent of the stage). */
const ARC = { cx: 50, cy: 34, rx: 44, ry: 50 };

function nodePosition(index: number) {
  const angle = Math.PI - (Math.PI * index) / (NODES.length - 1);
  return { left: ARC.cx + ARC.rx * Math.cos(angle), top: ARC.cy + ARC.ry * Math.sin(angle) };
}

/**
 * The agent at the centre, the case flowing around it. One node lights up at a time to show order.
 * Purpose: explanation. Paused off screen; static (all lit) under reduced motion.
 */
export function HubSection() {
  const reduced = useReducedMotion();
  const [ref, onScreen] = useOnScreen<HTMLDivElement>();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced || !onScreen) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % NODES.length), STEP_MS);
    return () => clearInterval(timer);
  }, [reduced, onScreen]);

  return (
    <div className="px-2 sm:px-4">
      <section aria-labelledby="hub-title" className="relative isolate overflow-hidden rounded-3xl bg-forest-950 px-4 py-24 text-forest-on sm:px-6">
        <HexPattern className="-left-24 top-10 w-72 opacity-60" />
        <Reveal className="mx-auto mb-12 max-w-[680px] text-center">
          <p className="mb-3 text-sm font-semibold text-accent">Powered by a read only agent</p>
          <h2 id="hub-title" className="mb-4 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            The intelligence behind <AccentWords tone="forest">every decision</AccentWords>
          </h2>
          <p className="text-lg text-forest-muted text-pretty">
            The agent reads history and policy, never writes. Every proposal is checked in code against the original charge before a person
            ever sees it.
          </p>
        </Reveal>

        <div ref={ref} className="relative mx-auto mb-8 hidden aspect-[2/1] max-w-4xl md:block">
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <path
              d={`M ${ARC.cx - ARC.rx} ${ARC.cy} A ${ARC.rx} ${ARC.ry} 0 0 0 ${ARC.cx + ARC.rx} ${ARC.cy}`}
              fill="none"
              stroke="var(--color-accent)"
              strokeOpacity="0.45"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              vectorEffect="non-scaling-stroke"
              className="animate-dash"
            />
          </svg>
          <Pedestal />
          {NODES.map((node, index) => {
            const { left, top } = nodePosition(index);
            const lit = reduced || index === active;
            return (
              <div
                key={node.label}
                aria-hidden="true"
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <span
                  className={cx(
                    'flex h-12 w-12 items-center justify-center rounded-xl border transition-[background-color,border-color,color,transform,box-shadow] duration-500 ease-out',
                    lit ? 'scale-110 border-accent bg-accent text-accent-on shadow-glow' : 'border-forest-line bg-forest-800 text-forest-muted',
                  )}
                >
                  <node.icon className="h-5 w-5" />
                </span>
                <span className={cx('whitespace-nowrap text-sm font-semibold transition-colors duration-500', lit ? 'text-forest-on' : 'text-forest-muted')}>
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>

        <ol className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 md:mt-4 md:grid-cols-3">
          {NODES.map((node, index) => (
            <Reveal as="li" key={node.label} delay={index * 50}>
              <div className="flex items-center gap-3 rounded-xl border border-forest-line bg-forest-900 px-4 py-3">
                <span className="tabular text-sm font-semibold text-accent">0{index + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-forest-on">{node.label}</p>
                  <p className="text-xs text-forest-muted">{node.detail}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>
    </div>
  );
}

/** Glowing stacked discs with the logo floating above, like the agent sitting on a platform. */
function Pedestal() {
  return (
    <div aria-hidden="true" className="absolute left-1/2 top-[34%] flex w-[34%] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
      <span className="relative z-10 mb-4 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-accent text-accent-on shadow-glow">
        <Receipt className="h-8 w-8" />
      </span>
      <span className="absolute top-12 h-24 w-3/4 animate-glow rounded-full bg-accent opacity-40 blur-2xl" />
      {[64, 82, 100].map((width, index) => (
        <span
          key={width}
          className="relative rounded-[50%] border border-accent bg-forest-800"
          style={{ width: `${width}%`, height: '2.5rem', marginTop: index === 0 ? 0 : '-1.75rem', opacity: 0.7 + index * 0.15 }}
        />
      ))}
    </div>
  );
}
