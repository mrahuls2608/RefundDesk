'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ActivityTabs } from '@/components/ops/ActivityTabs';
import { ApproveDialog, RejectDialog } from '@/components/ops/DecisionDialogs';
import { NotesPanel } from '@/components/ops/NotesPanel';
import { ProposalEditor } from '@/components/ops/ProposalEditor';
import { RelatedTransactions } from '@/components/ops/RelatedTransactions';
import { PageError } from '@/components/layout/PageError';
import { AIProposalCard, AmountCard, Avatar, Banner, Button, Card, SkeletonList, StatusBadge, Stepper, useToast } from '@/components/ui';
import { useCase, useRerunAgent } from '@/lib/api/hooks';
import type { CaseDetail } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/AuthProvider';
import { staffSteps } from '@/lib/caseSteps';
import { formatDateTime, formatINR } from '@/lib/format';
import { ISSUE_LABEL } from '@/lib/labels';
import { usePageTitle } from '@/lib/usePageTitle';

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const caseId = Number(id);
  const headingRef = usePageTitle(`Case #${caseId}`);
  const query = useCase(caseId);
  const detail = query.data;

  return (
    <>
      <Link href="/ops" className="inline-flex items-center gap-1 text-small text-primary-600 underline">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Cases
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none">
          Case <span className="font-mono">#{caseId}</span>
        </h1>
        {detail && <StatusBadge audience="staff" status={detail.status} />}
      </div>
      {query.isPending && <SkeletonList rows={4} label="Loading case" />}
      {query.isError && <PageError error={query.error} onRetry={() => query.refetch()} showTraceId />}
      {detail && <CaseHeader detail={detail} />}
      {detail && (
        <div className="grid gap-6 xl:grid-cols-12">
          {/* Decision panel first in source order: on mobile it sits at the top (Design §11). */}
          <aside aria-label="Decision" className="flex flex-col gap-4 xl:sticky xl:top-20 xl:order-2 xl:col-span-4 xl:self-start">
            <DecisionPanel detail={detail} />
            <Card>
              <NotesPanel caseId={detail.id} notes={detail.notes ?? []} />
            </Card>
          </aside>
          <div className="flex flex-col gap-4 xl:order-1 xl:col-span-8">
            <Card title="Transaction">
              <p className="text-body">
                <span className="font-semibold">{detail.transaction.merchant}</span> · <span className="tabular">{formatINR(detail.transaction.amount)}</span> ·{' '}
                {formatDateTime(detail.transaction.createdAt)}
              </p>
              <p className="text-small text-text-muted">
                Status: {detail.transaction.status} · Txn {detail.transaction.id} · Customer {detail.customer?.name}
              </p>
            </Card>
            <Card title="Customer's message">
              <p className="text-small text-text-muted">{ISSUE_LABEL[detail.issueType]}</p>
              <p className="whitespace-pre-wrap text-body">{detail.description ? `“${detail.description}”` : 'No details given.'}</p>
            </Card>
            <Card title="Recent transactions (30 days)">
              <RelatedTransactions items={detail.relatedTransactions ?? []} />
            </Card>
            <Card>
              <ActivityTabs detail={detail} />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function DecisionPanel({ detail }: { detail: CaseDetail }) {
  const { user } = useAuth();
  const toast = useToast();
  const rerun = useRerunAgent(detail.id);
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<'approve' | 'reject' | null>(null);
  const isApprover = user?.role === 'APPROVER';
  const canRerun = detail.status === 'PROPOSED' || detail.status === 'NEEDS_MANUAL_REVIEW' || detail.status === 'OPEN';
  const onRerun = () => rerun.mutate(undefined, { onSuccess: () => toast.show('AI investigation restarted', 'info') });

  if (detail.status === 'CLOSED' || detail.status === 'REFUNDED' || detail.status === 'REJECTED' || detail.status === 'APPROVED') {
    return <ClosedSummary detail={detail} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-h2">Decision</h2>
      {rerun.isError && <Banner variant="danger">Could not re-run the AI. Try again.</Banner>}
      {(detail.status === 'OPEN' || detail.status === 'INVESTIGATING') && <AIProposalCard state="pending" />}
      {detail.status === 'NEEDS_MANUAL_REVIEW' && <AIProposalCard state="failed" onRerun={onRerun} rerunning={rerun.isPending} />}
      {detail.status === 'PROPOSED' && detail.proposal && <AIProposalCard state="proposal" proposal={detail.proposal} />}

      {editing ? (
        <ProposalEditor detail={detail} onDone={() => setEditing(false)} />
      ) : (
        (detail.status === 'PROPOSED' || detail.status === 'NEEDS_MANUAL_REVIEW') && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setEditing(true)}>
              {detail.proposal && detail.status === 'PROPOSED' ? 'Edit proposal' : 'Write proposal'}
            </Button>
            {detail.status === 'PROPOSED' && canRerun && (
              <Button size="sm" variant="ghost" onClick={onRerun} loading={rerun.isPending}>
                <RefreshCw aria-hidden="true" className="h-4 w-4" /> Re-run AI
              </Button>
            )}
          </div>
        )
      )}

      {detail.status === 'PROPOSED' &&
        (isApprover ? (
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" onClick={() => setDialog('approve')}>
              Approve
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => setDialog('reject')}>
              Reject
            </Button>
          </div>
        ) : (
          <p className="text-small text-text-muted">Waiting for approver.</p>
        ))}

      {isApprover && (
        <>
          <ApproveDialog key={`approve-${detail.version}`} detail={detail} open={dialog === 'approve'} onClose={() => setDialog(null)} />
          <RejectDialog key={`reject-${detail.version}`} detail={detail} open={dialog === 'reject'} onClose={() => setDialog(null)} />
        </>
      )}
    </div>
  );
}

function ClosedSummary({ detail }: { detail: CaseDetail }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-h2">Outcome</h2>
      {detail.refund ? (
        <AmountCard variant="success" label="Refunded" amount={detail.refund.amount} caption={`Key ${detail.refund.idempotencyKey}`} />
      ) : (
        <AmountCard variant="muted" label="Requested amount" amount={detail.transaction.amount} />
      )}
      {detail.decision && (
        <p className="text-body">
          {detail.decision.decision === 'APPROVE' ? 'Approved' : 'Rejected'} by {detail.decision.approver}, Approver ·{' '}
          <span className="text-text-muted">{formatDateTime(detail.decision.createdAt)}</span>
        </p>
      )}
      {detail.decision?.comment && <p className="text-body">“{detail.decision.comment}”</p>}
    </div>
  );
}

/** At a glance: who, how much, what kind of dispute, and where the case is in its lifecycle. */
function CaseHeader({ detail }: { detail: CaseDetail }) {
  return (
    <section aria-label="Case summary" className="grid gap-6 rounded-2xl border border-border bg-surface p-6 shadow-sm lg:grid-cols-[1fr_1.4fr] lg:items-center">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2">
        <div className="col-span-2 flex items-center gap-3 sm:col-span-1 lg:col-span-2">
          <Avatar name={detail.customer?.name ?? '?'} />
          <div>
            <dt className="text-xs text-text-muted">Customer</dt>
            <dd className="font-semibold">{detail.customer?.name}</dd>
          </div>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Disputed amount</dt>
          <dd className="tabular text-2xl font-semibold tracking-tight">{formatINR(detail.transaction.amount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Issue</dt>
          <dd className="font-semibold">{ISSUE_LABEL[detail.issueType]}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Opened</dt>
          <dd className="text-body">{formatDateTime(detail.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Merchant</dt>
          <dd className="text-body">{detail.transaction.merchant}</dd>
        </div>
      </dl>
      <Stepper label="Case lifecycle" steps={staffSteps(detail.status)} />
    </section>
  );
}
