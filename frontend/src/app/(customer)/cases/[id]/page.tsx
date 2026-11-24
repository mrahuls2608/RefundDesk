'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PageError } from '@/components/layout/PageError';
import { AmountCard, Card, SkeletonList, StatusBadge, StatusTimeline, Stepper } from '@/components/ui';
import { useCase } from '@/lib/api/hooks';
import { formatDateTime, formatINR } from '@/lib/format';
import { customerMessage, customerOutcome, customerStatus, customerTimeline } from '@/lib/customerTimeline';
import { usePageTitle } from '@/lib/usePageTitle';

export default function CaseStatusPage() {
  const { id } = useParams<{ id: string }>();
  const caseId = Number(id);
  const headingRef = usePageTitle(`Request #${caseId}`);
  const query = useCase(caseId);
  const detail = query.data;
  const status = detail ? customerStatus(detail) : null;
  const announcement = useStatusAnnouncement(status);

  return (
    <>
      <Link href="/transactions" className="text-small text-primary-600 underline">
        ← My transactions
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none">
          Request <span className="font-mono">#{caseId}</span>
        </h1>
        {status && <StatusBadge audience="customer" status={status} />}
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {query.isPending && <SkeletonList rows={3} label="Loading your request" />}
      {query.isError && <PageError error={query.error} onRetry={() => query.refetch()} />}
      {detail && (
        <>
          <p className="text-body text-text-muted">
            {detail.transaction.merchant} · <span className="tabular">{formatINR(detail.transaction.amount)}</span> ·{' '}
            {formatDateTime(detail.transaction.createdAt)}
          </p>
          {customerOutcome(detail) === 'REFUNDED' && detail.refund && (
            <AmountCard variant="success" label="Refunded" amount={detail.refund.amount} caption="to your original payment method" />
          )}
          {customerOutcome(detail) === 'REJECTED' && <AmountCard variant="muted" label="Requested amount" amount={detail.transaction.amount} />}
          <Card>
            <Stepper label="Request progress" steps={customerTimeline(detail).map(({ key, label, state }) => ({ key, label, state }))} />
          </Card>
          <Card title="Timeline">
            <StatusTimeline steps={customerTimeline(detail)} />
          </Card>
          <Card>
            <p className="text-body">{customerMessage(detail)}</p>
            {detail.decision?.decision === 'REJECT' && detail.decision.comment && (
              <p className="mt-2 text-body">
                <span className="font-semibold">Reason:</span> {detail.decision.comment}
              </p>
            )}
            {customerOutcome(detail) === 'REJECTED' && (
              <p className="mt-2 text-small text-text-muted">Need help? Contact support from the app&apos;s help menu.</p>
            )}
          </Card>
        </>
      )}
    </>
  );
}

/** Announces status changes (not the first load) through a polite live region. */
function useStatusAnnouncement(status: string | null): string {
  const previous = useRef<string | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (status && previous.current && previous.current !== status) {
      setMessage(`Status updated: ${status}`);
    }
    previous.current = status;
  }, [status]);
  return message;
}
