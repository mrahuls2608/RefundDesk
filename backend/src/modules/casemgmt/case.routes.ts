import { Router } from 'express';
import { PageQuerySchema } from '../../common/pagination.js';
import { IdParamSchema, parseOrThrow } from '../../common/validate.js';
import { requireRole } from '../../security/authenticate.js';
import { currentUser } from '../../security/currentUser.js';
import { ALL_ROLES, Role, STAFF_ROLES } from '../user/role.js';
import {
  AddNoteSchema,
  CreateCaseSchema,
  DecisionSchema,
  ListCasesQuerySchema,
  UpdateProposalSchema,
} from './case.dto.js';
import type { CaseService } from './case.service.js';
import { decisionService } from './decision.service.js';

/** Thin controllers: validate, call one service method, return a DTO. Roles per TRD §5.3. */
export function createCaseRouter(cases: CaseService): Router {
  const router = Router();

  router.post('/api/cases', requireRole(Role.CUSTOMER), async (req, res) => {
    const input = parseOrThrow(CreateCaseSchema, req.body);
    res.status(201).json(await cases.create(currentUser(req), input));
  });

  router.get('/api/cases', requireRole(...ALL_ROLES), async (req, res) => {
    const query = parseOrThrow(ListCasesQuerySchema, req.query);
    const page = parseOrThrow(PageQuerySchema, req.query);
    res.json(await cases.list(currentUser(req), query, page));
  });

  router.get('/api/cases/:id', requireRole(...ALL_ROLES), async (req, res) => {
    res.json(await cases.get(currentUser(req), IdParamSchema.parse(req.params.id)));
  });

  router.post('/api/cases/:id/notes', requireRole(...STAFF_ROLES), async (req, res) => {
    const { body } = parseOrThrow(AddNoteSchema, req.body);
    res.status(201).json(await cases.addNote(currentUser(req), IdParamSchema.parse(req.params.id), body));
  });

  router.put('/api/cases/:id/proposal', requireRole(...STAFF_ROLES), async (req, res) => {
    const input = parseOrThrow(UpdateProposalSchema, req.body);
    res.json(await cases.updateProposal(currentUser(req), IdParamSchema.parse(req.params.id), input));
  });

  router.post('/api/cases/:id/rerun-agent', requireRole(...STAFF_ROLES), async (req, res) => {
    res.status(202).json(await cases.rerunAgent(currentUser(req), IdParamSchema.parse(req.params.id)));
  });

  router.post('/api/cases/:id/decision', requireRole(Role.APPROVER), async (req, res) => {
    const input = parseOrThrow(DecisionSchema, req.body);
    res.json(await decisionService.decide(currentUser(req), IdParamSchema.parse(req.params.id), input));
  });

  router.get('/api/cases/:id/audit', requireRole(...STAFF_ROLES), async (req, res) => {
    res.json(await cases.audit(currentUser(req), IdParamSchema.parse(req.params.id)));
  });

  return router;
}
