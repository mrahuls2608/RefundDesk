import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { bearer, buildApp, tokensFor, type Persona } from './helpers.js';

const app = buildApp();
let tokens: Record<Persona, string>;

beforeAll(async () => {
  tokens = await tokensFor(app);
});

describe('GET /api/transactions', () => {
  it("returns only the customer's own transactions, newest first, paginated", async () => {
    const res = await request(app).get('/api/transactions?page=0&size=50').set(bearer(tokens.customer));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(20);
    const ids = res.body.items.map((t: { id: number }) => t.id);
    expect(ids.every((id: number) => id >= 100 && id < 200)).toBe(true);
    const times = res.body.items.map((t: { createdAt: string }) => Date.parse(t.createdAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(res.body.items[0]).toMatchObject({ currency: 'INR', hasOpenCase: false, openCaseId: null });
  });

  it('serialises money as rupees with two decimals', async () => {
    const res = await request(app).get('/api/transactions?size=100').set(bearer(tokens.customer));
    const chai = res.body.items.find((t: { id: number }) => t.id === 106);
    expect(chai.amount).toBe(89.5);
  });

  it('caps the page size', async () => {
    const res = await request(app).get('/api/transactions?size=500').set(bearer(tokens.customer));
    expect(res.status).toBe(400);
  });

  it.each(['ops', 'approver', 'admin'] as const)('is forbidden for %s', async (persona) => {
    const res = await request(app).get('/api/transactions').set(bearer(tokens[persona]));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
