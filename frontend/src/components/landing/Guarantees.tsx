import { Accessibility, FileClock, Lock, Repeat1, ScanSearch, ShieldAlert, type LucideIcon } from 'lucide-react';
import { cx } from '@/components/ui';
import { AccentWords } from './AccentWords';
import { Reveal } from './Reveal';

interface Guarantee {
  title: string;
  body: string;
  icon: LucideIcon;
  wide?: boolean;
  featured?: boolean;
}

const GUARANTEES: Guarantee[] = [
  {
    title: 'A person approves every rupee',
    body: 'The AI has no path to refund code. An architecture test fails the build if anyone adds one, so this guarantee cannot quietly erode.',
    icon: Lock,
    wide: true,
    featured: true,
  },
  {
    title: 'Paid exactly once',
    body: 'One idempotency key per case, backed by a unique index. 10 parallel approvals create 1 refund row.',
    icon: Repeat1,
  },
  {
    title: 'Facts gathered for you',
    body: 'The agent reads 30 days of history and the matching policy, then cites the transaction ids behind each reason.',
    icon: ScanSearch,
  },
  {
    title: 'An audit trail finance can trust',
    body: 'Every status change records who, what and when inside the same database transaction. Entries can never be edited or deleted.',
    icon: FileClock,
    wide: true,
  },
  {
    title: 'Fails safe when the model does',
    body: 'Timeouts, rate limits and invalid output land in manual review, never in an automatic refund.',
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
      <Reveal className="mx-auto mb-12 max-w-[680px] text-center">
        <p className="mb-3 text-sm font-semibold text-primary-600">Guarantees</p>
        <h2 id="guarantees-title" className="text-3xl font-semibold tracking-tight text-text text-balance sm:text-5xl">
          One platform. <AccentWords>Every safeguard.</AccentWords>
        </h2>
      </Reveal>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {GUARANTEES.map((item, index) => (
          <Reveal as="li" key={item.title} delay={index * 60} className={cx('min-w-0', item.wide && 'md:col-span-2')}>
            <div
              className={cx(
                'group relative h-full overflow-hidden rounded-2xl border p-6 shadow-sm transition-[transform,box-shadow] duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-lg',
                item.featured ? 'border-forest-line bg-forest-900 text-forest-on' : 'border-border bg-surface',
              )}
            >
              {item.featured && (
                <span aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 animate-glow rounded-full bg-accent opacity-20 blur-3xl" />
              )}
              <span
                className={cx(
                  'relative mb-6 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-105',
                  item.featured ? 'bg-accent text-accent-on' : 'bg-primary-50 text-primary-600',
                )}
              >
                <item.icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className={cx('relative mb-2 text-xl font-semibold text-balance', item.featured ? 'text-forest-on' : 'text-text')}>{item.title}</h3>
              <p className={cx('relative text-base text-pretty', item.featured ? 'text-forest-muted' : 'text-text-muted')}>{item.body}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
