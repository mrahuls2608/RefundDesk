/**
 * Money is stored as integer paise (₹1 = 100 paise) so no floating point ever touches
 * an amount in storage or arithmetic. The API exposes rupees with two decimals.
 */
export type Paise = number;

const RUPEE_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export function rupeesToPaise(rupees: number | string): Paise {
  const text = typeof rupees === 'number' ? rupees.toFixed(2) : rupees.trim();
  if (!RUPEE_PATTERN.test(text)) {
    throw new RangeError(`Invalid rupee amount: ${rupees}`);
  }
  const [whole = '0', fraction = ''] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** Converts paise to a rupee number for JSON (exact for any value below 2^53 paise). */
export function paiseToRupees(paise: Paise): number {
  return Number(formatPaise(paise));
}

export function formatPaise(paise: Paise): string {
  const whole = Math.trunc(paise / 100);
  const fraction = String(Math.abs(paise % 100)).padStart(2, '0');
  return `${whole}.${fraction}`;
}

/** True when the value is a non-negative amount with at most two decimal places. */
export function isValidRupeeAmount(value: number): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  const scaled = value * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6 && Math.round(scaled) <= Number.MAX_SAFE_INTEGER;
}
