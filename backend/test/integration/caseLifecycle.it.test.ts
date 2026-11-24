import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { AuditEntryModel } from '../../src/modules/audit/audit.model.js';
import { RefundModel } from '../../src/modules/refund/refund.model.js';
import { bearer, buildApp, tokensFor, waitForStatus, type Persona } from './helpers.js';

const app = buildApp(); // mock LLM provider: deterministic offline investigator
let tokens: Record<Persona, string>;

beforeAll(async () => {
  tokens = await tokensFor(app);
});

async function raiseCase(transactionId: number, issueType = 'DUPLICATE_CHARGE', token = tokens.customer) {
  return request(app).post('/api/cases').set(bearer(token)).send({ transactionId, issueType, description: 'Charged twice for one order' });
}

describe('case lifecycle', () => {
  it('customer → AI proposal → approver approves → refunded once, closed, fully audited', async () => {
    const created = await raiseCase(101);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ id: expect.any(Number), status: 'OPEN' });
    const caseId = created.body.id as number;

    const proposed = await waitForStatus(app, tokens.ops, caseId, ['PROPOSED', 'NEEDS_MANUAL_REVIEW']);
    expect(proposed.status).toBe('PROPOSED');
    expect(proposed.proposal).toMatchObject({ action: 'FULL_REFUND', amount: 499, createdBy: 'AGENT', promptVersion: 'v1' });
    expect(proposed.relatedTransactions.find((t: { id: number }) => t.id === 100).possibleDuplicate).toBe(true);

    const decision = await request(app)
      .post(`/api/cases/${caseId}/decision`)
      .set(bearer(tokens.approver))
      .send({ decision: 'APPROVE', finalAmount: 499, comment: 'Duplicate confirmed', version: proposed.version });
    expect(decision.status).toBe(200);
    expect(decision.body).toMatchObject({
      status: 'REFUNDED',
      caseStatus: 'CLOSED',
      refund: { amount: 499, status: 'SUCCESS', idempotencyKey: `case-${caseId}` },
    });

    expect(await RefundModel.countDocuments({ caseId })).toBe(1);
    const audit = await request(app).get(`/api/cases/${caseId}/audit`).set(bearer(tokens.ops));
    expect(audit.body.map((e: { to: string }) => e.to)).toEqual(['OPEN', 'INVESTIGATING', 'PROPOSED', 'APPROVED', 'REFUNDED', 'CLOSED']);
    expect(audit.body.map((e: { action: string }) => e.action)).toContain('REFUND_EXECUTED');

    const customerView = await request(app).get(`/api/cases/${caseId}`).set(bearer(tokens.customer));
    expect(customerView.body.status).toBe('CLOSED');
    expect(customerView.body.refund.amount).toBe(499);
  });

  it('double-submitting a decision never creates a second refund', async () => {
    const created = await raiseCase(104);
    const caseId = created.body.id as number;
    const proposed = await waitForStatus(app, tokens.ops, caseId, ['PROPOSED']);
    const submit = () =>
      request(app)
        .post(`/api/cases/${caseId}/decision`)
        .set(bearer(tokens.approver))
        .send({ decision: 'APPROVE', finalAmount: 2499, comment: 'ok', version: proposed.version });
    const results = await Promise.all([submit(), submit(), submit()]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(2);
    expect(await RefundModel.countDocuments({ caseId })).toBe(1);
  });

  it('allows only one open case per transaction', async () => {
    const first = await raiseCase(105, 'OTHER');
    expect(first.status).toBe(201);
    const second = await raiseCase(105, 'OTHER');
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('CASE_ALREADY_OPEN');
    const txns = await request(app).get('/api/transactions?size=100').set(bearer(tokens.customer));
    const row = txns.body.items.find((t: { id: number }) => t.id === 105);
    expect(row).toMatchObject({ hasOpenCase: true, openCaseId: first.body.id });
  });

  it("returns 404 when a customer raises a case on someone else's transaction", async () => {
    const res = await raiseCase(201);
    expect(res.status).toBe(404);
  });

  it("returns 404 (not 403) for another customer's case", async () => {
    const created = await raiseCase(203, 'OTHER', tokens.otherCustomer);
    const res = await request(app).get(`/api/cases/${created.body.id}`).set(bearer(tokens.customer));
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('hides AI internals and notes from the customer view', async () => {
    const created = await raiseCase(103);
    const caseId = created.body.id as number;
    await waitForStatus(app, tokens.ops, caseId, ['PROPOSED']);
    await request(app).post(`/api/cases/${caseId}/notes`).set(bearer(tokens.ops)).send({ body: 'Internal only' });
    const res = await request(app).get(`/api/cases/${caseId}`).set(bearer(tokens.customer));
    expect(res.body.proposal).not.toHaveProperty('reasons');
    expect(res.body.proposal).not.toHaveProperty('confidence');
    expect(res.body.proposal).not.toHaveProperty('model');
    expect(res.body).not.toHaveProperty('notes');
    expect(res.body.timeline.every((s: Record<string, unknown>) => !('actor' in s))).toBe(true);
  });

  it('rejects an approval above the transaction amount with 422', async () => {
    const created = await raiseCase(102, 'FAILED_BUT_DEBITED');
    const caseId = created.body.id as number;
    const proposed = await waitForStatus(app, tokens.ops, caseId, ['PROPOSED']);
    const res = await request(app)
      .post(`/api/cases/${caseId}/decision`)
      .set(bearer(tokens.approver))
      .send({ decision: 'APPROVE', finalAmount: 1200.01, comment: 'too much', version: proposed.version });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('AMOUNT_EXCEEDS_TRANSACTION');
    expect(await RefundModel.countDocuments({ caseId })).toBe(0);
  });

  it('rejects with a reason, closes the case and creates no refund', async () => {
    const created = await raiseCase(107, 'WRONG_AMOUNT');
    const caseId = created.body.id as number;
    const proposed = await waitForStatus(app, tokens.ops, caseId, ['PROPOSED']);
    const res = await request(app)
      .post(`/api/cases/${caseId}/decision`)
      .set(bearer(tokens.approver))
      .send({ decision: 'REJECT', comment: 'The charge matches a completed order.', version: proposed.version });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'REJECTED', caseStatus: 'CLOSED', refund: null });
    expect(await RefundModel.countDocuments({ caseId })).toBe(0);
    const customerView = await request(app).get(`/api/cases/${caseId}`).set(bearer(tokens.customer));
    expect(customerView.body.decision.comment).toBe('The charge matches a completed order.');
  });

  it('lets ops edit the proposal amount within the transaction limit', async () => {
    const created = await raiseCase(111, 'WRONG_AMOUNT');
    const caseId = created.body.id as number;
    await waitForStatus(app, tokens.ops, caseId, ['PROPOSED']);
    const tooHigh = await request(app)
      .put(`/api/cases/${caseId}/proposal`)
      .set(bearer(tokens.ops))
      .send({ action: 'PARTIAL_REFUND', amount: 5000, reasons: ['x'] });
    expect(tooHigh.status).toBe(422);
    const ok = await request(app)
      .put(`/api/cases/${caseId}/proposal`)
      .set(bearer(tokens.ops))
      .send({ action: 'PARTIAL_REFUND', amount: 250, reasons: ['Only delivery fee charged twice'] });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ action: 'PARTIAL_REFUND', amount: 250, createdBy: '3' });
  });

  it('rejects an invalid transition with 409', async () => {
    const created = await raiseCase(108, 'OTHER');
    const caseId = created.body.id as number;
    const proposed = await waitForStatus(app, tokens.ops, caseId, ['PROPOSED']);
    await request(app)
      .post(`/api/cases/${caseId}/decision`)
      .set(bearer(tokens.approver))
      .send({ decision: 'REJECT', comment: 'no', version: proposed.version });
    const again = await request(app).put(`/api/cases/${caseId}/proposal`).set(bearer(tokens.ops)).send({ action: 'REJECT', amount: 0, reasons: ['x'] });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('INVALID_TRANSITION');
  });

  it('filters and sorts the ops queue', async () => {
    const res = await request(app).get('/api/cases?status=PROPOSED,NEEDS_MANUAL_REVIEW&sort=oldest').set(bearer(tokens.ops));
    expect(res.status).toBe(200);
    expect(res.body.items.every((c: { status: string }) => ['PROPOSED', 'NEEDS_MANUAL_REVIEW'].includes(c.status))).toBe(true);
    expect(res.body.items[0]).toMatchObject({ customerName: expect.any(String), amount: expect.any(Number), ageMinutes: expect.any(Number) });
  });

  it('keeps the audit log append-only', async () => {
    await expect(AuditEntryModel.updateMany({}, { $set: { action: 'TAMPERED' } })).rejects.toThrow('append-only');
    await expect(AuditEntryModel.deleteMany({})).rejects.toThrow('append-only');
  });
});
