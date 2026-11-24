import { describe, expect, it } from 'vitest';
import { formatPaise, isValidRupeeAmount, paiseToRupees, rupeesToPaise } from '../../src/common/money.js';

describe('money helpers', () => {
  it.each([
    [499, 49900],
    ['499.00', 49900],
    [0.29, 29],
    [89.5, 8950],
    ['1200.5', 120050],
    [0, 0],
  ])('rupeesToPaise(%s) = %s', (input, expected) => {
    expect(rupeesToPaise(input)).toBe(expected);
  });

  it.each(['-1', '1.234', 'abc', ''])('rejects invalid amount %j', (input) => {
    expect(() => rupeesToPaise(input)).toThrow(RangeError);
  });

  it('round-trips without floating point drift', () => {
    for (const paise of [1, 29, 8950, 49900, 123456789]) {
      expect(rupeesToPaise(paiseToRupees(paise))).toBe(paise);
    }
  });

  it('formats paise with two decimals', () => {
    expect(formatPaise(49900)).toBe('499.00');
    expect(formatPaise(5)).toBe('0.05');
  });

  it.each([
    [499, true],
    [0.1, true],
    [10.25, true],
    [10.255, false],
    [-1, false],
    [Number.NaN, false],
  ])('isValidRupeeAmount(%s) = %s', (value, expected) => {
    expect(isValidRupeeAmount(value)).toBe(expected);
  });
});
