import { Router } from 'express';
import { z } from 'zod';
import { parseOrThrow } from '../../common/validate.js';
import { authenticate } from '../../security/authenticate.js';
import { currentUser } from '../../security/currentUser.js';
import { loginRateLimit } from '../../security/loginRateLimit.js';
import { authService } from './auth.service.js';

const LoginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(1).max(128),
});

export const publicAuthRouter = Router();

publicAuthRouter.post('/api/auth/login', loginRateLimit, async (req, res) => {
  const { email, password } = parseOrThrow(LoginSchema, req.body);
  res.json(await authService.login(email, password));
});

export const meRouter = Router();

meRouter.get('/api/me', authenticate, async (req, res) => {
  res.json(await authService.me(currentUser(req).id));
});
