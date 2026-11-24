'use client';

import { useState } from 'react';
import { Banner, Button, Input, Select, Textarea, useToast } from '@/components/ui';
import { useUpdateProposal } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/http';
import type { CaseDetail, ProposalAction } from '@/lib/api/types';
import { formatINR } from '@/lib/format';
import { ACTION_LABEL } from '@/lib/labels';

const MAX_REASONS_TEXT = 1500;

/** Ops writes a proposal (manual review) or edits the AI's amount before approval. */
export function ProposalEditor({ detail, onDone }: { detail: CaseDetail; onDone: () => void }) {
  const toast = useToast();
  const update = useUpdateProposal(detail.id);
  const limit = detail.transaction.amount;
  const [action, setAction] = useState<ProposalAction>(detail.proposal?.action ?? 'FULL_REFUND');
  const [amountText, setAmountText] = useState((detail.proposal?.amount ?? limit).toFixed(2));
  const [reasonsText, setReasonsText] = useState((detail.proposal?.reasons ?? []).join('\n'));
  const [errors, setErrors] = useState<{ amount?: string; reasons?: string }>({});

  const submit = () => {
    const reasons = reasonsText.split('\n').map((r) => r.trim()).filter(Boolean);
    const amount = action === 'FULL_REFUND' ? limit : action === 'REJECT' ? 0 : Number(amountText);
    const next: typeof errors = {};
    if (action === 'PARTIAL_REFUND') {
      if (!/^\d+(\.\d{1,2})?$/.test(amountText.trim()) || amount <= 0) next.amount = 'Enter an amount greater than 0';
      else if (amount >= limit) next.amount = `A partial refund must be less than ${formatINR(limit)}`;
    }
    if (reasons.length === 0) next.reasons = 'Add at least one reason (one per line)';
    else if (reasons.length > 5) next.reasons = 'Use at most 5 reasons';
    setErrors(next);
    if (Object.keys(next).length) return;
    update.mutate(
      { action, amount, reasons },
      {
        onSuccess: () => {
          toast.show('Proposal saved');
          onDone();
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <h3 className="text-h3">{detail.proposal ? 'Edit proposal' : 'Write proposal'}</h3>
      {update.isError && <Banner variant="danger">{update.error instanceof ApiError ? update.error.message : 'Could not save the proposal.'}</Banner>}
      <Select
        label="Action"
        value={action}
        onChange={(e) => setAction(e.target.value as ProposalAction)}
        options={(Object.keys(ACTION_LABEL) as ProposalAction[]).map((value) => ({ value, label: ACTION_LABEL[value] }))}
      />
      {action === 'PARTIAL_REFUND' && (
        <Input label="Amount (₹)" inputMode="decimal" value={amountText} onChange={(e) => setAmountText(e.target.value)} helper={`Less than ${formatINR(limit)}`} error={errors.amount} required />
      )}
      <Textarea label="Reasons" helper="One reason per line." value={reasonsText} onChange={(e) => setReasonsText(e.target.value)} maxLength={MAX_REASONS_TEXT} error={errors.reasons} required rows={4} />
      <div className="flex gap-2">
        <Button variant="primary" onClick={submit} loading={update.isPending}>
          Save proposal
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
