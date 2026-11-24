import type { RequestHandler } from 'express';
import { ForbiddenError, UnauthenticatedError } from '../common/errors.js';
import { requestContext } from '../common/requestContext.js';
import type { Role } from '../modules/user/role.js';
import { jwtService } from './jwt.js';

const BEARER_PREFIX = 'Bearer ';

/** Default-deny: every router mounted after this requires a valid JWT. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');
  if (!header?.startsWith(BEARER_PREFIX)) {
    throw new UnauthenticatedError();
  }
  const principal = jwtService.verify(header.slice(BEARER_PREFIX.length).trim());
  req.principal = principal;
  const store = requestContext.getStore();
  if (store) store.userId = principal.id;
  next();
};

export function requireRole(...roles: readonly Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.principal) throw new UnauthenticatedError();
    if (!roles.includes(req.principal.role)) throw new ForbiddenError();
    next();
  };
}
