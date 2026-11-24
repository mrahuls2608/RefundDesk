import { describe, expect, it } from 'vitest';
import { formatAge, formatDateTime, formatDayLabel, formatINR } from './format';

describe('formatINR', () => {
  it('formats rupees with Indian grouping and two decimals', () => {
    expect(formatINR(499)).toBe('₹499.00');
    expect(formatINR(123456.5)).toBe('₹1,23,456.50');
  });
});

describe('formatDateTime', () => {
  it('shows times in IST', () => {
    // 13:05 UTC is 18:35 IST
    expect(formatDateTime('2026-11-20T13:05:10Z')).toMatch(/20 Nov.*6:35\s?pm/i);
  });
});

describe('formatDayLabel', () => {
  const now = new Date('2026-11-24T06:00:00Z');
  it('labels today and yesterday in IST', () => {
    expect(formatDayLabel('2026-11-24T01:00:00Z', now)).toBe('Today');
    expect(formatDayLabel('2026-11-23T10:00:00Z', now)).toBe('Yesterday');
    expect(formatDayLabel('2026-11-20T10:00:00Z', now)).toBe('20 Nov 2026');
  });
});

describe('formatAge', () => {
  it.each([
    [35, '35m'],
    [125, '2h'],
    [3000, '2d'],
  ])('%s minutes → %s', (minutes, expected) => {
    expect(formatAge(minutes)).toBe(expected);
  });
});
