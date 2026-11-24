import type { StepperStep } from '@/components/ui';
import type { CaseStatus } from './api/types';

const LABELS = ['Received', 'Investigate', 'Proposal', 'Decision', 'Outcome'] as const;

/** Index of the step in progress for each status; LABELS.length means every step is done. */
const CURRENT_STEP: Record<CaseStatus, number> = {
  OPEN: 1,
  INVESTIGATING: 1,
  NEEDS_MANUAL_REVIEW: 2,
  PROPOSED: 3,
  APPROVED: 4,
  REJECTED: 4,
  REFUNDED: 4,
  CLOSED: LABELS.length,
};

/** Staff view of where a case is in its lifecycle, for the horizontal Stepper. */
export function staffSteps(status: CaseStatus): StepperStep[] {
  const current = CURRENT_STEP[status];
  return LABELS.map((label, index) => ({
    key: label,
    label: label === 'Proposal' && status === 'NEEDS_MANUAL_REVIEW' ? 'Manual review' : label,
    state: index < current ? 'done' : index === current ? 'current' : 'upcoming',
  }));
}
