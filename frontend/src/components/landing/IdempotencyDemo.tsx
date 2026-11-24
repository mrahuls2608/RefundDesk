'use client';

import { MousePointerClick, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { cx } from '@/components/ui';
import { formatINR } from '@/lib/format';
import { AccentWords } from './AccentWords';
import { Reveal } from './Reveal';

const AMOUNT = 499;
const MAX_LOG = 5;

interface LogLine {
  id: number;
  status: 200 | 409;
  text: string;
}

/**
 * The proof you can touch: hammer the approve button and watch the ledger stay at one refund.
 * Mirrors the real behaviour: the first approval executes, later ones fail the version check (409).
 */
export function IdempotencyDemo() {
  const [clicks, setClicks] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);
  const refunds = clicks > 0 ? 1 : 0;

  const approve = () => {
    const next = clicks + 1;
    setClicks(next);
    const line: LogLine =
      next === 1
        ? { id: next, status: 200, text: `REFUND_EXECUTED · key case-42 · ${formatINR(AMOUNT)}` }
        : { id: next, status: 409, text: 'CONCURRENT_UPDATE · already decided · no new refund' };
    // Newest first, but the original 200 stays pinned at the bottom: it is the proof.
    setLog((lines) => {
      if (lines.length === 0) return [line];
      const first = lines[lines.length - 1]!;
      return [line, ...lines.slice(0, -1)].slice(0, MAX_LOG - 1).concat(first);
    });
  };

  const reset = () => {
    setClicks(0);
    setLog([]);
  };

  return (
    <section id="try-it" aria-labelledby="try-title" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal className="max-w-[680px]">
          <p className="mb-3 text-sm font-semibold text-primary-600">Double click test</p>
          <h2 id="try-title" className="mb-4 text-3xl font-semibold tracking-tight text-text text-balance sm:text-4xl">
            Click approve as fast as you can. <AccentWords>You still pay once.</AccentWords>
          </h2>
          <p className="text-lg text-text-muted text-pretty">
            Retries, double clicks and two approvers on the same case are where refund systems leak money. RefundDesk checks the case
            version, records one decision per case and keys the refund to the case, so the ledger can only ever hold one row.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="rounded-2xl border border-border bg-surface p-2 shadow-lg">
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-bg p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-text">Case #42 · {formatINR(AMOUNT)}</p>
                  <p className="text-xs text-text-muted">Proposed: full refund</p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  disabled={clicks === 0}
                  className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-text-muted transition-colors duration-150 ease-out hover:text-text disabled:opacity-40"
                >
                  <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Reset
                </button>
              </div>
              <button
                type="button"
                onClick={approve}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-3 py-2 text-base font-semibold text-accent-on transition-[transform,background-color] duration-100 ease-out hover:bg-accent-strong active:scale-[0.97]"
              >
                <MousePointerClick aria-hidden="true" className="h-5 w-5" />
                Approve refund
              </button>
              <dl className="grid grid-cols-2 gap-2" aria-live="polite">
                <Counter label="Approve clicks" value={clicks} />
                <Counter label="Refunds created" value={refunds} highlight />
              </dl>
              <ol aria-label="Server responses" className="flex min-h-[11rem] flex-col gap-2 font-mono text-xs">
                {log.length === 0 && <li className="text-text-muted">Responses appear here.</li>}
                {log.map((line) => (
                  <li key={line.id} className="flex animate-fade-up items-center gap-2">
                    <span
                      className={cx(
                        'tabular rounded-sm px-1.5 py-0.5 font-semibold',
                        line.status === 200 ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700',
                      )}
                    >
                      {line.status}
                    </span>
                    <span className="truncate text-text-muted">{line.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Counter({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cx('rounded-lg border p-3', highlight ? 'border-success-700 bg-success-50' : 'border-border bg-surface')}>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd key={value} className={cx('tabular animate-fade-up text-2xl font-semibold', highlight ? 'text-success-700' : 'text-text')}>
        {value}
      </dd>
    </div>
  );
}
