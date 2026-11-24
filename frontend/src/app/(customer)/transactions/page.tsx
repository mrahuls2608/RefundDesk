'use client';

import Link from 'next/link';
import { Banner, EmptyState, SkeletonList, TransactionRow } from '@/components/ui';
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

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-h1 outline-none">
        My transactions
      </h1>
      {transactions.isPending && <SkeletonList label="Loading your transactions" />}
      {transactions.isError && <PageError error={transactions.error} onRetry={() => transactions.refetch()} />}
      {transactions.data && transactions.data.items.length === 0 && (
        <EmptyState title="No transactions in the last 30 days." />
      )}
      {transactions.data && transactions.data.items.length > 0 && (
        <>
          <Banner variant="info">Something wrong with a payment? Choose &quot;Report issue&quot; on it.</Banner>
          {groupByDay(transactions.data.items).map(([day, items]) => (
            <section key={day} aria-labelledby={`day-${day}`} className="flex flex-col gap-2">
              <h2 id={`day-${day}`} className="text-small font-semibold text-text-muted">
                {formatDayLabel(items[0]!.createdAt)}
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((txn) => (
                  <li key={txn.id}>
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
