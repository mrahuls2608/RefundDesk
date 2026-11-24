'use client';

import { useState } from 'react';
import { Banner, Button, Input, Modal, Textarea, useToast } from '@/components/ui';
import { useDecision } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/http';
import type { CaseDetail } from '@/lib/api/types';
import { formatINR } from '@/lib/format';

const MAX_COMMENT = 500;

interface DialogProps {
  detail: CaseDetail;
  open: boolean;
  onClose: () => void;
}

/** Approve: editable amount capped at the transaction amount, required comment (Design §7.3). */
export function ApproveDialog({ detail, open, onClose }: DialogProps) {
  const toast = useToast();
  const decision = useDecision(detail.id);
  const suggested = detail.proposal && detail.proposal.action !== 'REJECT' ? detail.proposal.amount : detail.transaction.amount;
  const [amountText, setAmountText] = useState(suggested.toFixed(2));
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; comment?: string }>({});
  const limit = detail.transaction.amount;
  const customer = detail.customer?.name ?? 'the customer';

  const submit = () => {
    const amount = Number(amountText);
    const next: typeof errors = {};
    if (!/^\d+(\.\d{1,2})?$/.test(amountText.trim()) || amount <= 0) next.amount = 'Enter an amount greater than 0 with up to 2 decimals';
    else if (amount > limit) next.amount = `Amount can't exceed the transaction amount (${formatINR(limit)})`;
    if (!comment.trim()) next.comment = 'Add a comment for the audit log';
    setErrors(next);
    if (Object.keys(next).length) return;
    decision.mutate(
      { decision: 'APPROVE', finalAmount: amount, comment: comment.trim(), version: detail.version },
      {
        onSuccess: (result) => {
          toast.show(`Refund of ${formatINR(result.refund?.amount ?? amount)} completed`);
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      title={`Approve refund of ${formatINR(Number(amountText) || 0)} to ${customer}?`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={decision.isPending}>
            Approve refund
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <DecisionError error={decision.error} />
        <Input
          label="Refund amount (₹)"
          inputMode="decimal"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          helper={`Maximum ${formatINR(limit)}`}
          error={errors.amount}
          required
        />
        <Textarea label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={MAX_COMMENT} error={errors.comment} required rows={3} />
      </div>
    </Modal>
  );
}

/** Reject: the reason is shown to the customer, so the hint asks for plain language. */
export function RejectDialog({ detail, open, onClose }: DialogProps) {
  const toast = useToast();
  const decision = useDecision(detail.id);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>();

  const submit = () => {
    if (!reason.trim()) {
      setError('Add a reason. The customer will see it.');
      return;
    }
    setError(undefined);
    decision.mutate(
      { decision: 'REJECT', comment: reason.trim(), version: detail.version },
      {
        onSuccess: () => {
          toast.show('Request rejected', 'info');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      title="Reject this request?"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={submit} loading={decision.isPending}>
            Reject request
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <DecisionError error={decision.error} />
        <Textarea
          label="Reason"
          helper="Shown to the customer. Use plain language, e.g. “the charge matches a completed order”."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={MAX_COMMENT}
          error={error}
          required
          rows={3}
        />
      </div>
    </Modal>
  );
}

function DecisionError({ error }: { error: unknown }) {
  if (!error) return null;
  if (error instanceof ApiError && error.code === 'CONCURRENT_UPDATE') {
    return <Banner variant="danger">This case was just updated by someone else. Refresh to see the latest.</Banner>;
  }
  return <Banner variant="danger">{error instanceof ApiError ? error.message : 'Something went wrong. Try again.'}</Banner>;
}
