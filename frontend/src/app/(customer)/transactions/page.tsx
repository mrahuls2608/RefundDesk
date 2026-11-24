'use client';

import Link from 'next/link';
import { Inbox, ShieldCheck } from 'lucide-react';
import { EmptyState, SkeletonList, TransactionRow } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthProvider';
import { PageError } from '@/components/layout/PageError';
import { useTransactions } from '@/lib/api/hooks';
import type { Transaction } from '@/lib/api/types';
import { formatDayLabel, istDayKey } from '@/lib/format';
import { usePageTitle } from '@/lib/usePageTitle';

const linkButton =
  'inline-flex h-10 min-w-touch items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-body font-medium text-text hover:bg-primary-50';

export default function TransactionsPage() {
  const headingRef = usePageTitle('My transactions');
  const transactions = useTransactions();
  const { user } = useAuth();
  const openCases = transactions.data?.items.filter((t) => t.openCaseId) ?? [];

  return (
    <>
      <section aria-labelledby="page-title" className="relative isolate overflow-hidden rounded-3xl bg-forest-900 p-6 text-forest-on sm:p-8">
        <span aria-hidden="true" className="absolute -right-16 -top-16 -z-10 h-56 w-56 rounded-full bg-accent opacity-20 blur-3xl" />
        <p className="text-sm text-forest-muted">Hi {user?.name ?? 'there'}</p>
        <h1 id="page-title" ref={headingRef} tabIndex={-1} className="mb-4 text-3xl font-semibold tracking-tight outline-none">
          My transactions
        </h1>
        <div className="flex flex-wrap gap-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-forest-800 px-3 py-1.5 text-sm">
            <Inbox aria-hidden="true" className="h-4 w-4 text-accent" />
            {openCases.length === 0 ? 'No open requests' : `${openCases.length} open request${openCases.length > 1 ? 's' : ''}`}
          </p>
          <p className="inline-flex items-center gap-2 rounded-full bg-forest-800 px-3 py-1.5 text-sm">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-accent" />
            Something wrong with a payment? Choose Report issue
          </p>
        </div>
      </section>
      {transactions.isPending && <SkeletonList label="Loading your transactions" />}
      {transactions.isError && <PageError error={transactions.error} onRetry={() => transactions.refetch()} />}
      {transactions.data && transactions.data.items.length === 0 && (
        <EmptyState title="No transactions in the last 30 days." />
      )}
      {transactions.data && transactions.data.items.length > 0 && (
        <>
          {groupByDay(transactions.data.items).map(([day, items]) => (
            <section key={day} aria-labelledby={`day-${day}`} className="flex flex-col gap-2">
              <h2 id={`day-${day}`} className="text-small font-semibold text-text-muted">
                {formatDayLabel(items[0]!.createdAt)}
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((txn, index) => (
                  <li key={txn.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
                    <TransactionRow
                      merchant={txn.merchant}
                      amount={txn.amount}
                      createdAt={txn.createdAt}
                      status={txn.status}
                      hasOpenCase={txn.hasOpenCase}
                      action={
                        txn.openCaseId ? (
                          <Link href={`/cases/${txn.openCaseId}`} className={linkButton}>
                            View case<span className="sr-only"> for {txn.merchant}</span>
                          </Link>
                        ) : (
                          <Link href={`/cases/new?txn=${txn.id}`} className={linkButton}>
                            Report issue<span className="sr-only"> with {txn.merchant}</span>
                          </Link>
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </>
  );
}

function groupByDay(items: Transaction[]): [string, Transaction[]][] {
  const groups = new Map<string, Transaction[]>();
  for (const txn of items) {
    const key = istDayKey(txn.createdAt);
    groups.set(key, [...(groups.get(key) ?? []), txn]);
  }
  return [...groups.entries()];
}
