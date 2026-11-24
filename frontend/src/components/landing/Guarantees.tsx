import { Accessibility, FileClock, Lock, ScanSearch, ShieldAlert, Repeat1, type LucideIcon } from 'lucide-react';
import { cx } from '@/components/ui';
import { Reveal } from './Reveal';

interface Guarantee {
  title: string;
  body: string;
  icon: LucideIcon;
  wide?: boolean;
}

const GUARANTEES: Guarantee[] = [
  {
    title: 'Facts gathered before you open the case',
    body: 'The agent reads 30 days of history and the matching policy, then cites the exact transaction ids behind every reason.',
    icon: ScanSearch,
    wide: true,
  },
  {
    title: 'A person approves every rupee',
    body: 'The AI has no path to refund code. An architecture test fails the build if anyone adds one.',
    icon: Lock,
  },
  {
    title: 'Paid exactly once',
    body: 'Every refund carries one idempotency key per case, backed by a unique index. 10 parallel approvals create 1 refund row.',
    icon: Repeat1,
  },
  {
    title: 'An audit trail finance can trust',
    body: 'Every status change records who, what and when inside the same database transaction. Entries can never be edited or deleted.',
    icon: FileClock,
    wide: true,
  },
  {
    title: 'Fails safe when the model does',
    body: 'Timeouts, rate limits and invalid output all land in manual review, never in an automatic refund.',
    icon: ShieldAlert,
  },
  {
    title: 'Built for every agent',
    body: 'WCAG 2.1 AA, full keyboard support and j, k, Enter shortcuts in the queue.',
    icon: Accessibility,
  },
];

export function Guarantees() {
  return (
    <section id="guarantees" aria-labelledby="guarantees-title" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <Reveal className="mb-12 max-w-[680px]">
        <p className="mb-3 text-sm font-semibold text-primary-600">Guarantees</p>
        <h2 id="guarantees-title" className="text-3xl font-semibold tracking-tight text-text text-balance sm:text-4xl">
          Fast for your team, safe for your money
        </h2>
      </Reveal>
      <ul className="grid gap-4 md:grid-cols-3">
        {GUARANTEES.map((item, index) => (
          <Reveal as="li" key={item.title} delay={index * 60} className={cx(item.wide && 'md:col-span-2')}>
            <div className="group h-full rounded-2xl border border-border bg-surface p-6 shadow-sm transition-[transform,box-shadow] duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-lg">
              <span className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-transform duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-105">
                <item.icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mb-2 text-xl font-semibold text-text text-balance">{item.title}</h3>
              <p className="text-base text-text-muted text-pretty">{item.body}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
