import { Check } from 'lucide-react';
import { cx } from '@/components/ui';
import { Reveal } from './Reveal';

const ROLES = [
  {
    verb: 'Report',
    who: 'Customer portal',
    items: ['Transactions grouped by day', 'Report in two taps', 'Plain status: received to refunded', 'Live updates while the AI works'],
  },
  {
    verb: 'Investigate',
    who: 'Ops console',
    items: ['Queue filtered to what needs action', 'AI reasons and confidence', 'Possible duplicates flagged', 'Notes, rerun AI, edit the proposal'],
  },
  {
    verb: 'Decide',
    who: 'Approver',
    items: ['Every fact on one screen', 'Amount capped at the charge', 'Required comment for the audit', 'Conflict warning if someone beat you'],
  },
];

/** One card per role, like the reference's Create · Manage · Deliver strip. Swipeable on small screens. */
export function RoleCards() {
  return (
    <section aria-labelledby="roles-title" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_2fr]">
        <Reveal className="min-w-0">
          <p className="mb-3 text-sm font-semibold text-primary-600">One flow, three roles</p>
          <h2 id="roles-title" className="mb-4 text-3xl font-semibold tracking-tight text-text text-balance sm:text-4xl">
            Report · Investigate · Decide
          </h2>
          <p className="text-lg text-text-muted text-pretty">
            Customers, support agents and approvers each get a screen built for their part of the job, all reading from the same case.
          </p>
        </Reveal>
        <ul className="-mx-4 flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
          {ROLES.map((role, index) => (
            <Reveal as="li" key={role.verb} delay={index * 90} className="w-64 shrink-0 snap-start sm:w-auto">
              <div
                className={cx(
                  'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-[transform,box-shadow] duration-300 ease-out',
                  '[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-lg',
                )}
              >
                <span
                  aria-hidden="true"
                  className="absolute right-0 top-0 h-24 w-1/2 bg-[repeating-linear-gradient(0deg,var(--color-border)_0_2px,transparent_2px_8px)] opacity-80"
                />
                <p className="relative text-xs font-semibold uppercase tracking-wider text-text-muted">{role.who}</p>
                <h3 className="relative mb-6 text-2xl font-semibold text-text">{role.verb}</h3>
                <ul className="relative flex flex-col gap-3">
                  {role.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
                      <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,var(--color-accent),transparent)] opacity-25 transition-opacity duration-300 ease-out group-hover:opacity-50"
                />
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
