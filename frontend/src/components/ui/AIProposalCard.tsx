import { RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import type { Proposal } from '@/lib/api/types';
import { formatINR } from '@/lib/format';
import { ACTION_LABEL } from '@/lib/labels';
import { Button } from './Button';
import { ConfidenceMeter } from './ConfidenceMeter';
import { Spinner } from './Spinner';

export type AIProposalCardProps =
  | { state: 'proposal'; proposal: Proposal }
  | { state: 'pending' }
  | { state: 'failed'; onRerun?: () => void; rerunning?: boolean; reason?: string };

/**
 * Styled as a suggestion (outlined, AI colour), never green, so it can't be mistaken for an approval.
 * Human-written proposals reuse the card without the AI header.
 */
export function AIProposalCard(props: AIProposalCardProps) {
  if (props.state === 'failed') {
    return (
      <section aria-labelledby="ai-failed-title" className="rounded-md border border-warning-700 bg-warning-50 p-4">
        <h3 id="ai-failed-title" className="flex items-center gap-2 text-h3 text-warning-700">
          <TriangleAlert aria-hidden="true" className="h-5 w-5" />
          AI couldn&apos;t complete this case. Review manually.
        </h3>
        {props.reason && <p className="mt-1 text-small text-text-muted">{props.reason}</p>}
        {props.onRerun && (
          <Button size="sm" className="mt-3" onClick={props.onRerun} loading={props.rerunning}>
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Re-run AI
          </Button>
        )}
      </section>
    );
  }

  const isAgent = props.state === 'pending' || props.proposal.createdBy === 'AGENT';
  return (
    <section aria-labelledby="proposal-title" className="overflow-hidden rounded-md border border-ai-700 bg-surface">
      <h3 id="proposal-title" className="flex items-center gap-2 bg-ai-50 px-4 py-2 text-small font-semibold text-ai-700">
        <Sparkles aria-hidden="true" className="h-4 w-4" />
        {isAgent ? 'AI proposal — needs human approval' : 'Proposal (written by ops) — needs approval'}
      </h3>
      <div className="flex flex-col gap-3 p-4">
        {props.state === 'pending' ? (
          <p className="flex items-center gap-2 text-body text-text-muted">
            <Spinner label="AI investigating" /> AI investigating…
          </p>
        ) : (
          <ProposalBody proposal={props.proposal} />
        )}
      </div>
    </section>
  );
}

function ProposalBody({ proposal }: { proposal: Proposal }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-h3">{ACTION_LABEL[proposal.action]}</span>
        <span className="tabular text-h2">{formatINR(proposal.amount)}</span>
      </div>
      {proposal.confidence != null && <ConfidenceMeter value={proposal.confidence} />}
      {proposal.reasons && proposal.reasons.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-body">
          {proposal.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      {proposal.model && (
        <p className="text-caption text-text-muted">
          {proposal.model} · prompt {proposal.promptVersion}
        </p>
      )}
    </>
  );
}
