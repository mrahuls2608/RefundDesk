import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { UnauthenticatedError } from '../common/errors.js';
import { ALL_ROLES, type Role } from '../modules/user/role.js';

const ALGORITHM = 'HS256';

export interface AuthPrincipal {
  id: number;
  role: Role;
  name: string;
}

const ClaimsSchema = z.object({
  sub: z.string().regex(/^\d+$/),
  role: z.enum(ALL_ROLES as [Role, ...Role[]]),
  name: z.string(),
});

export const jwtService = {
  ttlSeconds: env.JWT_TTL_MINUTES * 60,

  sign(principal: AuthPrincipal, secret = env.JWT_SECRET): string {
    return jwt.sign({ role: principal.role, name: principal.name }, secret, {
      algorithm: ALGORITHM,
      subject: String(principal.id),
      expiresIn: this.ttlSeconds,
    });
  },

  verify(token: string, secret = env.JWT_SECRET): AuthPrincipal {
    try {
      const decoded = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
      const claims = ClaimsSchema.parse(decoded);
      return { id: Number(claims.sub), role: claims.role, name: claims.name };
    } catch {
      throw new UnauthenticatedError('Invalid or expired token');
    }
  },
};
