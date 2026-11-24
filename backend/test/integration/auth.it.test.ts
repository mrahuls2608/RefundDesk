import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { getRedis } from '../../src/infra/redis.js';
import { DEMO_PASSWORD } from '../../src/seed/seedData.js';
import { bearer, buildApp, login } from './helpers.js';

const app = buildApp();

describe('POST /api/auth/login', () => {
  it('returns a JWT and the user for valid credentials', async () => {
    await getRedis().flushdb();
    const res = await request(app).post('/api/auth/login').send({ email: 'asha@demo.in', password: DEMO_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ expiresIn: 3600, user: { id: 1, name: 'Asha', role: 'CUSTOMER' } });
    expect(res.body.accessToken).toMatch(/^eyJ/);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('returns 401 with the standard error body for a wrong password', async () => {
    await getRedis().flushdb();
    const res = await request(app).post('/api/auth/login').send({ email: 'asha@demo.in', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'UNAUTHENTICATED', message: 'Email or password is incorrect', traceId: expect.any(String) });
    expect(res.headers['x-trace-id']).toBe(res.body.traceId);
  });

  it('returns the same error for an unknown email (no account enumeration)', async () => {
    await getRedis().flushdb();
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@demo.in', password: 'whatever1' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email or password is incorrect');
  });

  it('validates the body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.fields).toHaveProperty('email');
  });

  it('rate-limits to 5 attempts per minute per IP', async () => {
    await getRedis().flushdb();
    const attempt = () => request(app).post('/api/auth/login').send({ email: 'asha@demo.in', password: 'wrong-password' });
    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
  });
});

describe('GET /api/me', () => {
  it('returns the current user', async () => {
    const token = await login(app, 'approver');
    const res = await request(app).get('/api/me').set(bearer(token));
    expect(res.body).toEqual({ id: 4, name: 'Priya', email: 'priya@demo.in', role: 'APPROVER' });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 for a tampered token', async () => {
    const token = await login(app, 'customer');
    const res = await request(app).get('/api/me').set(bearer(`${token.slice(0, -2)}xx`));
    expect(res.status).toBe(401);
  });
});

describe('GET /actuator/health', () => {
  it('is public and reports UP', async () => {
    const res = await request(app).get('/actuator/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });
});
