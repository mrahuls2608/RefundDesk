import type { TimelineStep } from '@/components/ui';
import type { CaseDetail, CaseStatus } from './api/types';
import { customerStatusOf, type CustomerStatus } from './labels';

const IN_REVIEW: readonly CaseStatus[] = ['INVESTIGATING', 'PROPOSED', 'NEEDS_MANUAL_REVIEW'];
const DECISION: readonly CaseStatus[] = ['APPROVED', 'REJECTED'];

export function customerOutcome(detail: CaseDetail): 'REFUNDED' | 'REJECTED' | null {
  if (detail.refund) return 'REFUNDED';
  if (detail.decision?.decision === 'REJECT') return 'REJECTED';
  return null;
}

export function customerStatus(detail: CaseDetail): CustomerStatus {
  return customerStatusOf(detail.status, customerOutcome(detail));
}

/** Collapses the internal states into the 4 customer steps: Received → In review → Decision → Refunded/Closed. */
export function customerTimeline(detail: CaseDetail): TimelineStep[] {
  const firstAt = (statuses: readonly CaseStatus[]) => detail.timeline.find((t) => statuses.includes(t.status))?.at;
  const outcome = customerOutcome(detail);
  const reached = [
    firstAt(['OPEN']) ?? detail.createdAt,
    firstAt(IN_REVIEW),
    firstAt(DECISION),
    firstAt(outcome === 'REFUNDED' ? ['REFUNDED'] : ['CLOSED']),
  ];
  const labels = ['Received', 'In review', 'Decision', outcome === 'REJECTED' ? 'Closed' : 'Refunded'];
  const lastReached = reached.reduce<number>((last, at, index) => (at ? index : last), 0);
  const finished = lastReached === labels.length - 1;
  return labels.map((label, index) => ({
    key: label,
    label,
    at: reached[index],
    state: index < lastReached || (finished && index === lastReached) ? 'done' : index === lastReached ? 'current' : 'upcoming',
  }));
}

export function customerMessage(detail: CaseDetail): string {
  const outcome = customerOutcome(detail);
  if (outcome === 'REFUNDED') return 'The refund has been sent to your original payment method.';
  if (outcome === 'REJECTED') return "We couldn't approve this refund.";
  if (detail.status === 'OPEN' || detail.status === 'INVESTIGATING') {
    return "We're checking your transactions. Most cases are reviewed within 24 hours.";
  }
  return 'Your request is being reviewed by our team. Most cases are reviewed within 24 hours.';
}
