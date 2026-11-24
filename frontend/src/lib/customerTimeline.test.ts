import { describe, expect, it } from 'vitest';
import type { CaseDetail } from './api/types';
import { customerMessage, customerStatus, customerTimeline } from './customerTimeline';

const base: CaseDetail = {
  id: 42,
  status: 'OPEN',
  version: 0,
  issueType: 'DUPLICATE_CHARGE',
  description: null,
  createdAt: '2026-11-20T13:10:00Z',
  updatedAt: '2026-11-20T13:10:00Z',
  transaction: { id: 101, amount: 499, currency: 'INR', merchant: 'FoodNow', status: 'SUCCESS', createdAt: '2026-11-20T13:05:00Z' },
  proposal: null,
  decision: null,
  refund: null,
  timeline: [{ status: 'OPEN', at: '2026-11-20T13:10:00Z' }],
};

const states = (detail: CaseDetail) => customerTimeline(detail).map((s) => `${s.label}:${s.state}`);

describe('customerTimeline', () => {
  it('starts at Received', () => {
    expect(states(base)).toEqual(['Received:current', 'In review:upcoming', 'Decision:upcoming', 'Refunded:upcoming']);
    expect(customerStatus(base)).toBe('In review');
  });

  it('hides internal states behind "In review"', () => {
    const detail: CaseDetail = {
      ...base,
      status: 'NEEDS_MANUAL_REVIEW',
      timeline: [...base.timeline, { status: 'INVESTIGATING', at: '2026-11-20T13:11:00Z' }, { status: 'NEEDS_MANUAL_REVIEW', at: '2026-11-20T13:12:00Z' }],
    };
    expect(states(detail)).toEqual(['Received:done', 'In review:current', 'Decision:upcoming', 'Refunded:upcoming']);
    expect(customerMessage(detail)).toContain('being reviewed by our team');
  });

  it('completes every step after a refund', () => {
    const detail: CaseDetail = {
      ...base,
      status: 'CLOSED',
      refund: { id: 'r1', amount: 499, status: 'SUCCESS', idempotencyKey: 'case-42', createdAt: '2026-11-20T14:00:00Z' },
      timeline: ['OPEN', 'INVESTIGATING', 'PROPOSED', 'APPROVED', 'REFUNDED', 'CLOSED'].map((status, i) => ({
        status: status as CaseDetail['status'],
        at: `2026-11-20T13:1${i}:00Z`,
      })),
    };
    expect(states(detail).every((s) => s.endsWith(':done'))).toBe(true);
    expect(customerStatus(detail)).toBe('Refunded');
  });

  it('ends with Closed after a rejection', () => {
    const detail: CaseDetail = {
      ...base,
      status: 'CLOSED',
      decision: { decision: 'REJECT', finalAmount: null, comment: 'Matches a completed order', approver: null, createdAt: '2026-11-20T14:00:00Z' },
      timeline: ['OPEN', 'INVESTIGATING', 'PROPOSED', 'REJECTED', 'CLOSED'].map((status, i) => ({ status: status as CaseDetail['status'], at: `2026-11-20T13:1${i}:00Z` })),
    };
    expect(customerTimeline(detail).at(-1)).toMatchObject({ label: 'Closed', state: 'done' });
    expect(customerStatus(detail)).toBe('Rejected');
  });
});
