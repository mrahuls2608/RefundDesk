import { Tag } from '@/components/ui';
import type { RelatedTransaction } from '@/lib/api/types';
import { formatDateTime, formatINR } from '@/lib/format';

/** Highlights same-merchant, same-amount charges within 10 minutes as "Possible duplicate". */
export function RelatedTransactions({ items }: { items: RelatedTransaction[] }) {
  if (items.length === 0) return <p className="text-small text-text-muted">No other transactions in the last 30 days.</p>;
  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {items.map((txn) => (
        <li key={txn.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 ${txn.isCaseTransaction ? 'bg-primary-50' : ''}`}>
          <span className="text-body">
            <span className="tabular text-text-muted">#{txn.id}</span> {txn.merchant}
            <span className="text-small text-text-muted"> · {formatDateTime(txn.createdAt)}</span>
          </span>
          <span className="flex items-center gap-2">
            {txn.isCaseTransaction && <Tag tone="info">This case</Tag>}
            {txn.possibleDuplicate && <Tag tone="warning">Possible duplicate</Tag>}
            {txn.status !== 'SUCCESS' && <Tag tone={txn.status === 'FAILED' ? 'danger' : 'warning'}>{txn.status === 'FAILED' ? 'Failed' : 'Pending'}</Tag>}
            <span className="tabular font-medium">{formatINR(txn.amount)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
