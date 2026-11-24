import { describe, expect, it } from 'vitest';
import { RefundModel } from '../../src/modules/refund/refund.model.js';
import { refundService } from '../../src/modules/refund/refund.service.js';
import './helpers.js';

describe('RefundService.execute idempotency', () => {
  it('creates exactly one refund for 10 parallel calls with the same key', async () => {
    const key = 'case-9001';
    const results = await Promise.all(Array.from({ length: 10 }, () => refundService.execute(9001, 49900, key)));
    expect(await RefundModel.countDocuments({ idempotencyKey: key })).toBe(1);
    const ids = new Set(results.map((r) => String(r._id)));
    expect(ids.size).toBe(1);
  });

  it('returns the original refund for a repeated call, ignoring a different amount', async () => {
    const first = await refundService.execute(9002, 10000, 'case-9002');
    const second = await refundService.execute(9002, 99999, 'case-9002');
    expect(String(second._id)).toBe(String(first._id));
    expect(second.amountPaise).toBe(10000);
  });
});
