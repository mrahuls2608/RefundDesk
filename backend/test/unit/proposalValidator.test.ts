import { describe, expect, it } from 'vitest';
import { validateProposal } from '../../src/modules/agent/proposalValidator.js';

const TXN_PAISE = 49900;
const json = (value: unknown) => JSON.stringify(value);
const good = { action: 'FULL_REFUND', amount: 499, reasons: ['Identical charge 40s earlier (txn 100)'], confidence: 0.92 };

describe('validateProposal', () => {
  it('accepts a valid full refund', () => {
    const outcome = validateProposal(json(good), TXN_PAISE);
    expect(outcome).toEqual({ valid: true, proposal: { action: 'FULL_REFUND', amountPaise: 49900, reasons: good.reasons, confidence: 0.92 } });
  });

  it('accepts JSON inside a markdown fence', () => {
    expect(validateProposal('```json\n' + json(good) + '\n```', TXN_PAISE).valid).toBe(true);
  });

  it('accepts a partial refund below the transaction amount', () => {
    expect(validateProposal(json({ ...good, action: 'PARTIAL_REFUND', amount: 250 }), TXN_PAISE).valid).toBe(true);
  });

  it.each([
    ['prose', 'I think we should refund it.'],
    ['null', null],
    ['broken JSON', '{"action": "FULL_REFUND",'],
  ])('rejects non-JSON output (%s)', (_label, content) => {
    expect(validateProposal(content, TXN_PAISE).valid).toBe(false);
  });

  it.each([
    ['unknown action', { ...good, action: 'AUTO_APPROVE' }],
    ['amount above transaction', { ...good, amount: 999 }],
    ['negative amount', { ...good, amount: -5 }],
    ['three decimals', { ...good, action: 'PARTIAL_REFUND', amount: 10.555 }],
    ['confidence above 1', { ...good, confidence: 1.5 }],
    ['no reasons', { ...good, reasons: [] }],
    ['too many reasons', { ...good, reasons: ['a', 'b', 'c', 'd', 'e', 'f'] }],
    ['reject with an amount', { ...good, action: 'REJECT', amount: 10 }],
    ['full refund with a different amount', { ...good, amount: 400 }],
    ['partial refund equal to full amount', { ...good, action: 'PARTIAL_REFUND', amount: 499 }],
    ['amount as string', { ...good, amount: '499' }],
  ])('rejects %s', (_label, proposal) => {
    expect(validateProposal(json(proposal), TXN_PAISE).valid).toBe(false);
  });

  it('explains why the amount was rejected', () => {
    const outcome = validateProposal(json({ ...good, amount: 999 }), TXN_PAISE);
    expect(outcome).toEqual({ valid: false, error: 'amount exceeds the transaction amount' });
  });
});
