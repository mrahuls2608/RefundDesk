import { Router } from 'express';
import { z } from 'zod';
import { AppError, ErrorCode, NotFoundError } from '../../common/errors.js';
import { IdParamSchema, parseOrThrow } from '../../common/validate.js';
import { requireRole } from '../../security/authenticate.js';
import { authService } from '../auth/auth.service.js';
import { policyRepository } from '../policy/policy.repository.js';
import { ALL_ROLES, Role } from '../user/role.js';
import { userRepository } from '../user/user.repository.js';

const CreateUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(ALL_ROLES as [Role, ...Role[]]),
});

const UpdatePolicySchema = z.object({
  ruleText: z.string().trim().min(1).max(1000),
  maxDays: z.number().int().positive().nullable(),
  active: z.boolean(),
});

const DUPLICATE_KEY = 11000;

export const adminRouter = Router();
adminRouter.use('/api/admin', requireRole(Role.ADMIN));

adminRouter.get('/api/admin/users', async (_req, res) => {
  const users = await userRepository.listAll();
  res.json(users.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt.toISOString() })));
});

adminRouter.post('/api/admin/users', async (req, res) => {
  const input = parseOrThrow(CreateUserSchema, req.body);
  const passwordHash = await authService.hashPassword(input.password);
  try {
    const user = await userRepository.create({ name: input.name, email: input.email, role: input.role, passwordHash });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    if ((err as { code?: number }).code === DUPLICATE_KEY) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, 'Email already in use', { email: 'Email already in use' });
    }
    throw err;
  }
});

adminRouter.get('/api/admin/policies', async (_req, res) => {
  const rules = await policyRepository.listAll();
  res.json(rules.map((r) => ({ id: r._id, issueType: r.issueType, ruleText: r.ruleText, maxDays: r.maxDays, active: r.active })));
});

adminRouter.put('/api/admin/policies/:id', async (req, res) => {
  const id = IdParamSchema.parse(req.params.id);
  const updated = await policyRepository.update(id, parseOrThrow(UpdatePolicySchema, req.body));
  if (!updated) throw new NotFoundError('Policy', id);
  res.json({ id: updated._id, issueType: updated.issueType, ruleText: updated.ruleText, maxDays: updated.maxDays, active: updated.active });
});
