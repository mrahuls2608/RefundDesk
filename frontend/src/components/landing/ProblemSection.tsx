import { CircleX, FileClock, Landmark, Receipt, ScrollText, TriangleAlert, type LucideIcon } from 'lucide-react';
import { CountUp } from './CountUp';
import { Reveal } from './Reveal';

const REASONS = [
  'Agents dig through transactions by hand for every complaint',
  'Policy lives in someone’s head, so outcomes differ by who picks up the case',
  'A retry or a double click can pay the same refund twice',
  'Nobody can say later who approved what, or why',
];

const ORBIT: { label: string; icon: LucideIcon; position: string; delay: string }[] = [
  { label: 'Transactions', icon: Receipt, position: 'left-[6%] top-[14%]', delay: '0s' },
  { label: 'Policies', icon: ScrollText, position: 'right-[4%] top-[20%]', delay: '-1.5s' },
  { label: 'Refunds', icon: Landmark, position: 'left-[2%] bottom-[18%]', delay: '-3s' },
  { label: 'Audit', icon: FileClock, position: 'right-[8%] bottom-[12%]', delay: '-4.5s' },
];

const STATS = [
  { value: 96, label: 'integration tests on real MongoDB and Redis' },
  { value: 65, label: 'role access checks on every build' },
  { value: 22, label: 'labelled cases in the agent eval suite' },
  { value: 0, label: 'duplicate refunds, however fast you click' },
];

export function ProblemSection() {
  return (
    <section aria-labelledby="problem-title" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <Reveal className="flex min-w-0 flex-col items-start gap-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-danger-50 px-3 py-1 text-xs font-semibold text-danger-700">
            <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5" /> The problem
          </p>
          <h2 id="problem-title" className="max-w-[680px] text-3xl font-semibold tracking-tight text-text text-balance sm:text-4xl">
            Most refund desks run on guesswork and good intentions
          </h2>
          <p className="max-w-[680px] text-lg text-text-muted text-pretty">
            Disputes arrive faster than people can investigate them, and the cost of a mistake is real money that rarely comes back.
          </p>
          <div className="w-full rounded-2xl border border-border bg-surface p-2 shadow-sm">
            <p className="px-4 pb-2 pt-3 text-sm font-semibold text-text">Why it keeps happening</p>
            <ul className="flex flex-col gap-1">
              {REASONS.map((reason) => (
                <li key={reason} className="flex items-start gap-3 rounded-lg bg-bg px-4 py-3 text-base text-text-muted">
                  <CircleX aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-danger-700" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={120} className="min-w-0">
          <Radar />
        </Reveal>
      </div>
      <Reveal delay={80}>
        <dl className="mt-20 grid grid-cols-2 border-y border-border lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col gap-2 px-4 py-8 sm:px-6 ${index % 2 === 1 ? 'border-l border-border' : ''} ${index >= 2 ? 'border-t border-border lg:border-t-0' : ''} ${index === 2 ? 'lg:border-l' : ''}`}
            >
              <dt className="order-2 text-sm text-text-muted text-pretty">{stat.label}</dt>
              <dd className="order-1 text-4xl font-semibold tracking-tight text-primary-600 sm:text-5xl">
                <CountUp to={stat.value} />
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

/** Scattered sources orbiting a central alert: pulse rings radiate outwards, the chips float. Decorative. */
function Radar() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-md">
      {[100, 76, 52].map((size) => (
        <span
          key={size}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border"
          style={{ width: `${size}%`, height: `${size}%` }}
        />
      ))}
      <span className="absolute inset-[12%] animate-spin-slow rounded-full border border-dashed border-border-strong opacity-40" />
      {['0s', '1.2s', '2.4s'].map((delay) => (
        <span
          key={delay}
          className="absolute left-1/2 top-1/2 -ml-[20%] -mt-[20%] h-[40%] w-[40%] animate-ring-pulse rounded-full border-2 border-accent"
          style={{ animationDelay: delay }}
        />
      ))}
      <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface shadow-lg">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-700">
          <TriangleAlert className="h-6 w-6" />
        </span>
      </span>
      {ORBIT.map((item) => (
        <span
          key={item.label}
          className={`absolute ${item.position} flex animate-float items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-text shadow-lg`}
          style={{ animationDelay: item.delay }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <item.icon className="h-4 w-4" />
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
}
