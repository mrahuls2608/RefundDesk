'use client';

import { Check, CircleCheck, LoaderCircle, Pause, Play, Sparkles, UserRound } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cx } from '@/components/ui';
import { formatINR } from '@/lib/format';
import { useOnScreen, useReducedMotion } from '@/lib/motion';

/** Time each stage stays on screen before the next one appears (ms). The last one holds, then loops. */
const STAGE_MS = [1400, 1300, 1300, 2300, 1700, 3200] as const;
const LAST_STAGE = STAGE_MS.length - 1;
const AMOUNT = 499;

const STATUS_BY_STAGE = ['Open', 'Investigating', 'Investigating', 'Proposed', 'Approved', 'Refunded'] as const;

/**
 * Product as hero: one case travelling from report to refund, on a loop.
 * Purpose: explanation. Pausable (WCAG 2.2.2), paused while off screen, static under reduced motion.
 */
export function HeroDemo() {
  const reduced = useReducedMotion();
  const [ref, onScreen] = useOnScreen<HTMLDivElement>();
  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(false);
  const shown = reduced ? LAST_STAGE : stage;
  const playing = !reduced && !paused && onScreen;

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setStage((s) => (s === LAST_STAGE ? 0 : s + 1)), STAGE_MS[stage]);
    return () => clearTimeout(timer);
  }, [playing, stage]);

  return (
    <div ref={ref} className="relative">
      <p className="sr-only">
        Example: a customer reports being charged twice for ₹499.00. The AI agent reads 30 days of transactions and the duplicate charge
        policy, then proposes a full refund with 92% confidence. Priya, an approver, approves it and ₹499.00 is refunded once.
      </p>
      <div aria-hidden="true" className="rounded-2xl border border-border bg-surface p-2 shadow-lg">
        <div className="rounded-lg border border-border bg-bg">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-text">Case #42 · Charged twice</p>
              <p className="text-xs text-text-muted">FoodNow · {formatINR(AMOUNT)} · Asha</p>
            </div>
            <StatusPill stage={shown} />
          </div>
          <ol className="flex min-h-[23rem] flex-col gap-3 p-4">
            <Step visible={shown >= 0}>
              <Bubble icon={<UserRound className="h-4 w-4" />} title="Asha, customer">
                “I was charged twice for one order.”
              </Bubble>
            </Step>
            <Step visible={shown >= 1}>
              <ToolCall done={shown >= 2} call="getTransactions(days: 30)" result="20 rows · twin charge found 40 s earlier" />
            </Step>
            <Step visible={shown >= 2}>
              <ToolCall done={shown >= 3} call="getPolicy(DUPLICATE_CHARGE)" result="refund the later charge in full" />
            </Step>
            <Step visible={shown >= 3}>
              <ProposalMini confidenceVisible={shown >= 3} />
            </Step>
            <Step visible={shown >= 5}>
              <div className="flex items-center gap-3 rounded-lg border border-success-700 bg-success-50 px-3 py-2">
                <CircleCheck className="h-5 w-5 text-success-700" />
                <div>
                  <p className="text-sm font-semibold text-success-700">{formatINR(AMOUNT)} refunded</p>
                  <p className="text-xs text-text-muted">Approved by Priya · key case-42 · paid once</p>
                </div>
              </div>
            </Step>
          </ol>
        </div>
      </div>
      {!reduced && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="absolute -bottom-4 right-4 inline-flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-text-muted shadow-sm transition-transform duration-150 ease-out hover:text-text active:scale-[0.97]"
        >
          {paused ? <Play aria-hidden="true" className="h-3.5 w-3.5" /> : <Pause aria-hidden="true" className="h-3.5 w-3.5" />}
          {paused ? 'Play demo' : 'Pause demo'}
        </button>
      )}
    </div>
  );
}

function Step({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <li
      className={cx(
        'transition-[opacity,transform,filter] duration-500 ease-out',
        visible ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-2 opacity-0 blur-sm',
      )}
    >
      {children}
    </li>
  );
}

function Bubble({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">{icon}</span>
      <div className="rounded-lg border border-border bg-surface px-3 py-2">
        <p className="text-xs text-text-muted">{title}</p>
        <p className="text-sm text-text">{children}</p>
      </div>
    </div>
  );
}

function ToolCall({ call, result, done }: { call: string; result: string; done: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs">
      <span className="mt-0.5 text-ai-700">{done ? <Check className="h-3.5 w-3.5" /> : <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}</span>
      <div className="min-w-0">
        <p className="truncate text-text">{call}</p>
        <p className={cx('truncate text-text-muted transition-opacity duration-300 ease-out', done ? 'opacity-100' : 'opacity-0')}>→ {result}</p>
      </div>
    </div>
  );
}

function ProposalMini({ confidenceVisible }: { confidenceVisible: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ai-700 bg-surface">
      <p className="flex items-center gap-2 bg-ai-50 px-3 py-1.5 text-xs font-semibold text-ai-700">
        <Sparkles className="h-3.5 w-3.5" /> AI proposal · needs human approval
      </p>
      <div className="flex flex-col gap-2 px-3 py-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-text">Full refund</span>
          <span className="tabular text-sm font-semibold text-text">{formatINR(AMOUNT)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full origin-left rounded-full bg-ai-700 transition-transform duration-1000 ease-out"
              style={{ transform: `scaleX(${confidenceVisible ? 0.92 : 0})` }}
            />
          </div>
          <span className="tabular text-xs font-medium text-text">92%</span>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ stage }: { stage: number }) {
  const label = STATUS_BY_STAGE[stage] ?? 'Open';
  const tone =
    label === 'Refunded' || label === 'Approved' ? 'bg-success-50 text-success-700' : label === 'Proposed' ? 'bg-ai-50 text-ai-700' : 'bg-info-50 text-info-700';
  return (
    <span key={label} className={cx('inline-flex animate-fade-up items-center rounded-full px-2 py-0.5 text-xs font-medium', tone)}>
      {label}
    </span>
  );
}
