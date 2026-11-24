import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { UnauthenticatedError } from '../../src/common/errors.js';
import { jwtService } from '../../src/security/jwt.js';

const principal = { id: 7, role: 'APPROVER' as const, name: 'Priya' };

describe('jwtService', () => {
  it('round-trips the principal', () => {
    expect(jwtService.verify(jwtService.sign(principal))).toEqual(principal);
  });

  it('puts the documented claims in the token', () => {
    const claims = jwt.decode(jwtService.sign(principal)) as Record<string, unknown>;
    expect(claims).toMatchObject({ sub: '7', role: 'APPROVER', name: 'Priya' });
    expect((claims.exp as number) - (claims.iat as number)).toBe(60 * 60);
  });

  it('rejects a token signed with another secret', () => {
    const forged = jwtService.sign(principal, 'another-secret-another-secret-12345');
    expect(() => jwtService.verify(forged)).toThrow(UnauthenticatedError);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ role: 'ADMIN', name: 'x' }, process.env.JWT_SECRET!, { subject: '1', expiresIn: -10 });
    expect(() => jwtService.verify(expired)).toThrow(UnauthenticatedError);
  });

  it('rejects the "none" algorithm', () => {
    const unsigned = jwt.sign({ role: 'ADMIN', name: 'x' }, '', { subject: '1', algorithm: 'none' });
    expect(() => jwtService.verify(unsigned)).toThrow(UnauthenticatedError);
  });

  it('rejects an unknown role claim', () => {
    const bad = jwt.sign({ role: 'SUPERUSER', name: 'x' }, process.env.JWT_SECRET!, { subject: '1' });
    expect(() => jwtService.verify(bad)).toThrow(UnauthenticatedError);
  });
});
