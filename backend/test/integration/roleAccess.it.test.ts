import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { bearer, buildApp, tokensFor, type Persona } from './helpers.js';

/**
 * Every endpoint × every role (TRD §5.3). "allowed" means the role passes the access check;
 * the business outcome (404, 409...) is covered elsewhere. Add a row for every new endpoint.
 */
const app = buildApp();
let tokens: Record<Persona, string>;
let caseId: number;

type Method = 'get' | 'post' | 'put';
interface Row {
  method: Method;
  path: () => string;
  body?: unknown;
  allowed: Persona[];
}

const ALL: Persona[] = ['customer', 'ops', 'approver', 'admin'];
const STAFF: Persona[] = ['ops', 'approver', 'admin'];

const MATRIX: Row[] = [
  { method: 'get', path: () => '/api/me', allowed: ALL },
  { method: 'get', path: () => '/api/transactions', allowed: ['customer'] },
  { method: 'post', path: () => '/api/cases', body: { transactionId: 999999, issueType: 'OTHER' }, allowed: ['customer'] },
  { method: 'get', path: () => '/api/cases', allowed: ALL },
  { method: 'get', path: () => `/api/cases/${caseId}`, allowed: ALL },
  { method: 'post', path: () => `/api/cases/${caseId}/notes`, body: { body: 'note' }, allowed: STAFF },
  { method: 'put', path: () => `/api/cases/${caseId}/proposal`, body: { action: 'REJECT', amount: 0, reasons: ['x'] }, allowed: STAFF },
  { method: 'post', path: () => `/api/cases/${caseId}/rerun-agent`, allowed: STAFF },
  { method: 'post', path: () => `/api/cases/${caseId}/decision`, body: { decision: 'REJECT', comment: 'x', version: -1 }, allowed: ['approver'] },
  { method: 'get', path: () => `/api/cases/${caseId}/audit`, allowed: STAFF },
  { method: 'get', path: () => '/api/admin/users', allowed: ['admin'] },
  { method: 'get', path: () => '/api/admin/policies', allowed: ['admin'] },
  { method: 'get', path: () => '/actuator/prometheus', allowed: ['admin'] },
];

beforeAll(async () => {
  tokens = await tokensFor(app);
  const created = await request(app).post('/api/cases').set(bearer(tokens.customer)).send({ transactionId: 110, issueType: 'OTHER' });
  caseId = created.body.id;
});

const cases = MATRIX.flatMap((row) => ALL.map((persona) => [row, persona] as const));

describe('role access matrix', () => {
  it.each(cases)('%# %s', async (row, persona) => {
    const res = await request(app)[row.method](row.path()).set(bearer(tokens[persona])).send(row.body as object);
    if (row.allowed.includes(persona)) {
      expect([401, 403]).not.toContain(res.status);
    } else {
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }
  });

  it.each(MATRIX)('requires authentication: $method', async (row) => {
    const res = await request(app)[row.method](row.path()).send(row.body as object);
    expect(res.status).toBe(401);
  });
});
