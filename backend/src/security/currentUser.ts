import type { Request } from 'express';
import { UnauthenticatedError } from '../common/errors.js';
import type { AuthPrincipal } from './jwt.js';

declare module 'express-serve-static-core' {
  interface Request {
    principal?: AuthPrincipal;
  }
}

/** The authenticated user. Services take it as an argument; never trust ids from the request body. */
export function currentUser(req: Request): AuthPrincipal {
  if (!req.principal) throw new UnauthenticatedError();
  return req.principal;
}
