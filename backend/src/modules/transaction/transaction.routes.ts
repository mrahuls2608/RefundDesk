import { Router } from 'express';
import { PageQuerySchema } from '../../common/pagination.js';
import { parseOrThrow } from '../../common/validate.js';
import { requireRole } from '../../security/authenticate.js';
import { currentUser } from '../../security/currentUser.js';
import { Role } from '../user/role.js';
import type { TransactionService } from './transaction.service.js';

export function createTransactionRouter(service: TransactionService): Router {
  const router = Router();
  router.get('/api/transactions', requireRole(Role.CUSTOMER), async (req, res) => {
    const query = parseOrThrow(PageQuerySchema, req.query);
    res.json(await service.listForCustomer(currentUser(req).id, query));
  });
  return router;
}
