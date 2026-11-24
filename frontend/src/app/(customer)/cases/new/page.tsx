'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { PageError } from '@/components/layout/PageError';
import { Banner, Button, Card, RadioGroup, SkeletonList, Textarea, useToast } from '@/components/ui';
import { useCreateCase, useTransactions } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/http';
import type { IssueType } from '@/lib/api/types';
import { formatDateTime, formatINR } from '@/lib/format';
import { ISSUE_LABEL } from '@/lib/labels';
import { usePageTitle } from '@/lib/usePageTitle';

const MAX_DESCRIPTION = 1000;
const ISSUE_TYPES = Object.keys(ISSUE_LABEL) as IssueType[];

const RaiseCaseSchema = z.object({
  issueType: z.enum(ISSUE_TYPES as [IssueType, ...IssueType[]], { error: 'Choose what went wrong' }),
  description: z.string().trim().max(MAX_DESCRIPTION, `Keep it under ${MAX_DESCRIPTION} characters`),
});

export default function RaiseCasePage() {
  return (
    <Suspense fallback={<SkeletonList rows={2} />}>
      <RaiseCaseForm />
    </Suspense>
  );
}

function RaiseCaseForm() {
  const headingRef = usePageTitle('Report an issue');
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const transactionId = Number(params.get('txn'));
  const transactions = useTransactions();
  const createCase = useCreateCase();
  const [issueType, setIssueType] = useState<IssueType | ''>('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ issueType?: string; description?: string }>({});
  const txn = transactions.data?.items.find((t) => t.id === transactionId);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = RaiseCaseSchema.safeParse({ issueType: issueType || undefined, description });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    createCase.mutate(
      { transactionId, issueType: parsed.data.issueType, description: parsed.data.description || undefined },
      {
        onSuccess: (created) => {
          toast.show('Request submitted');
          router.push(`/cases/${created.id}`);
        },
      },
    );
  };

  return (
    <>
      <Link href="/transactions" className="text-small text-primary-600 underline">
        ← My transactions
      </Link>
      <h1 ref={headingRef} tabIndex={-1} className="text-h1 outline-none">
        Report an issue
      </h1>
      {transactions.isPending && <SkeletonList rows={2} label="Loading transaction" />}
      {transactions.isError && <PageError error={transactions.error} onRetry={() => transactions.refetch()} />}
      {transactions.data && !txn && <Banner variant="warning">We couldn&apos;t find that transaction. Go back and pick one from your list.</Banner>}
      {txn?.openCaseId && (
        <Banner variant="info" action={<Link href={`/cases/${txn.openCaseId}`} className="text-small font-medium text-primary-600 underline">View case</Link>}>
          You already have an open request for this payment.
        </Banner>
      )}
      {txn && !txn.openCaseId && (
        <>
          <Card title="Transaction">
            <dl className="grid grid-cols-2 gap-2 text-body">
              <dt className="text-text-muted">Merchant</dt>
              <dd>{txn.merchant}</dd>
              <dt className="text-text-muted">Amount</dt>
              <dd className="tabular">{formatINR(txn.amount)}</dd>
              <dt className="text-text-muted">Date</dt>
              <dd>{formatDateTime(txn.createdAt)}</dd>
            </dl>
          </Card>
          {createCase.isError && <Banner variant="danger">{submitErrorMessage(createCase.error)}</Banner>}
          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
            <RadioGroup
              legend="What went wrong?"
              name="issueType"
              required
              options={ISSUE_TYPES.map((value) => ({ value, label: ISSUE_LABEL[value] }))}
              value={issueType}
              onChange={setIssueType}
              error={errors.issueType}
            />
            <Textarea
              label="Tell us more"
              helper="Optional. Order number, what you expected, anything that helps."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESCRIPTION}
              error={errors.description}
            />
            <div className="sticky bottom-0 -mx-4 border-t border-border bg-surface p-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
              <Button type="submit" variant="primary" size="lg" fullWidth loading={createCase.isPending}>
                Submit request
              </Button>
            </div>
          </form>
        </>
      )}
    </>
  );
}

function submitErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === 'CASE_ALREADY_OPEN') return 'You already have an open request for this payment.';
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Try again.';
}
