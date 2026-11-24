import { InvalidTransitionError } from '../../common/errors.js';
import { CaseStatus } from './caseStatus.js';

const {
  OPEN, INVESTIGATING, PROPOSED, NEEDS_MANUAL_REVIEW, APPROVED, REJECTED, REFUNDED, CLOSED,
} = CaseStatus;

/**
 * The only place that knows which status changes are legal (PRD §7, TRD §7.1).
 * PROPOSED → INVESTIGATING supports "Re-run AI"; NEEDS_MANUAL_REVIEW → INVESTIGATING too.
 */
const ALLOWED: Readonly<Record<CaseStatus, readonly CaseStatus[]>> = {
  [OPEN]: [INVESTIGATING],
  [INVESTIGATING]: [PROPOSED, NEEDS_MANUAL_REVIEW],
  [NEEDS_MANUAL_REVIEW]: [PROPOSED, INVESTIGATING],
  [PROPOSED]: [APPROVED, REJECTED, INVESTIGATING, PROPOSED],
  [APPROVED]: [REFUNDED],
  [REFUNDED]: [CLOSED],
  [REJECTED]: [CLOSED],
  [CLOSED]: [],
};

export const caseStateMachine = {
  canTransition(from: CaseStatus, to: CaseStatus): boolean {
    return ALLOWED[from].includes(to);
  },

  assertTransition(caseId: number, from: CaseStatus, to: CaseStatus): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidTransitionError(caseId, from, to);
    }
  },

  allowedFrom(from: CaseStatus): readonly CaseStatus[] {
    return ALLOWED[from];
  },
};
