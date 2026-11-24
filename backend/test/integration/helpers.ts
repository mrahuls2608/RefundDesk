import request from 'supertest';
import { expect } from 'vitest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/container.js';
import type { AgentService } from '../../src/modules/agent/index.js';
import { DEMO_PASSWORD } from '../../src/seed/seedData.js';
import { getRedis } from '../../src/infra/redis.js';

export const EMAILS = {
  customer: 'asha@demo.in',
  otherCustomer: 'rahul@demo.in',
  ops: 'ravi@demo.in',
  approver: 'priya@demo.in',
  admin: 'admin@demo.in',
} as const;

export type Persona = keyof typeof EMAILS;

export function buildApp(agent?: AgentService) {
  const container = createContainer({ agent, dispatch: 'inline' });
  return createApp({ caseService: container.caseService });
}

export async function login(app: ReturnType<typeof buildApp>, persona: Persona): Promise<string> {
  await getRedis().flushdb(); // keep the login rate limiter out of unrelated tests
  const res = await request(app).post('/api/auth/login').send({ email: EMAILS[persona], password: DEMO_PASSWORD });
  expect(res.status).toBe(200);
  return res.body.accessToken as string;
}

export async function tokensFor(app: ReturnType<typeof buildApp>) {
  const entries = await Promise.all((Object.keys(EMAILS) as Persona[]).map(async (p) => [p, await login(app, p)] as const));
  return Object.fromEntries(entries) as Record<Persona, string>;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Polls the case until the async investigation settles. */
export async function waitForStatus(
  app: ReturnType<typeof buildApp>,
  token: string,
  caseId: number,
  expected: string[],
  timeoutMs = 10_000,
) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await request(app).get(`/api/cases/${caseId}`).set(bearer(token));
    if (expected.includes(res.body.status)) return res.body;
    if (Date.now() > deadline) throw new Error(`Case ${caseId} stuck in ${res.body.status}`);
    await new Promise((r) => setTimeout(r, 100));
  }
}
