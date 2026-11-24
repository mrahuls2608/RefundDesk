import { describe, expect, it } from 'vitest';
import { InvalidTransitionError } from '../../src/common/errors.js';
import { caseStateMachine } from '../../src/modules/casemgmt/caseStateMachine.js';
import { ALL_CASE_STATUSES, CaseStatus, type CaseStatus as Status } from '../../src/modules/casemgmt/caseStatus.js';

const VALID: [Status, Status][] = [
  ['OPEN', 'INVESTIGATING'],
  ['INVESTIGATING', 'PROPOSED'],
  ['INVESTIGATING', 'NEEDS_MANUAL_REVIEW'],
  ['NEEDS_MANUAL_REVIEW', 'PROPOSED'],
  ['NEEDS_MANUAL_REVIEW', 'INVESTIGATING'],
  ['PROPOSED', 'APPROVED'],
  ['PROPOSED', 'REJECTED'],
  ['PROPOSED', 'INVESTIGATING'],
  ['PROPOSED', 'PROPOSED'],
  ['APPROVED', 'REFUNDED'],
  ['REFUNDED', 'CLOSED'],
  ['REJECTED', 'CLOSED'],
];

const isValid = (from: Status, to: Status) => VALID.some(([f, t]) => f === from && t === to);
const ALL_PAIRS = ALL_CASE_STATUSES.flatMap((from) => ALL_CASE_STATUSES.map((to) => [from, to] as [Status, Status]));

describe('caseStateMachine', () => {
  it.each(VALID)('allows %s → %s', (from, to) => {
    expect(caseStateMachine.canTransition(from, to)).toBe(true);
    expect(() => caseStateMachine.assertTransition(42, from, to)).not.toThrow();
  });

  it.each(ALL_PAIRS.filter(([f, t]) => !isValid(f, t)))('rejects %s → %s', (from, to) => {
    expect(caseStateMachine.canTransition(from, to)).toBe(false);
    expect(() => caseStateMachine.assertTransition(42, from, to)).toThrow(InvalidTransitionError);
  });

  it('never allows skipping approval straight to a refund', () => {
    for (const from of ALL_CASE_STATUSES.filter((s) => s !== CaseStatus.APPROVED)) {
      expect(caseStateMachine.canTransition(from, CaseStatus.REFUNDED)).toBe(false);
    }
  });

  it('treats CLOSED as terminal', () => {
    expect(caseStateMachine.allowedFrom(CaseStatus.CLOSED)).toEqual([]);
  });

  it('produces the documented error message', () => {
    expect(() => caseStateMachine.assertTransition(42, 'OPEN', 'APPROVED')).toThrow('Case 42 cannot move from OPEN to APPROVED');
  });
});
