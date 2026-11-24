import { describe, expect, it } from 'vitest';
import { staffSteps } from './caseSteps';

const states = (status: Parameters<typeof staffSteps>[0]) => staffSteps(status).map((s) => s.state[0]).join('');

describe('staffSteps', () => {
  it.each([
    ['OPEN', 'dcuuu'],
    ['INVESTIGATING', 'dcuuu'],
    ['NEEDS_MANUAL_REVIEW', 'ddcuu'],
    ['PROPOSED', 'dddcu'],
    ['REFUNDED', 'ddddc'],
    ['CLOSED', 'ddddd'],
  ] as const)('%s → %s', (status, expected) => {
    expect(states(status)).toBe(expected);
  });

  it('labels the proposal step as manual review when the AI failed', () => {
    expect(staffSteps('NEEDS_MANUAL_REVIEW')[2]!.label).toBe('Manual review');
  });
});
