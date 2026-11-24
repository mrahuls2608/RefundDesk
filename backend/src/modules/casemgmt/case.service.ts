import type { PipelineStage } from 'mongoose';
import { AmountExceedsTransactionError, CaseAlreadyOpenError, NotFoundError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { formatPaise, paiseToRupees, rupeesToPaise } from '../../common/money.js';
import { toPage, type PageQuery } from '../../common/pagination.js';
import { withTransaction } from '../../infra/db.js';
import { nextSequence } from '../../infra/sequence.js';
import { metrics } from '../../metrics/metrics.js';
import type { AuthPrincipal } from '../../security/jwt.js';
import { auditService, type Actor } from '../audit/audit.service.js';
import { refundService } from '../refund/refund.service.js';
import { transactionRepository } from '../transaction/transaction.repository.js';
import { STAFF_ROLES } from '../user/role.js';
import { userRepository } from '../user/user.repository.js';
import type { CreateCaseInput, ListCasesQuery, UpdateProposalInput } from './case.dto.js';
import { toProposalResponse } from './case.dto.js';
import { CaseModel, type CaseDoc } from './case.model.js';
import { toAuditView, toCaseDetail, toNoteView } from './case.views.js';
import { CaseStatus, ProposalAction } from './caseStatus.js';
import { transitionCase } from './caseTransitions.js';
import { DecisionModel, type DecisionDoc } from './decision.model.js';
import type { InvestigationDispatcher } from './investigationDispatcher.js';
import { NoteModel } from './note.model.js';
import { ProposalModel, type ProposalDoc } from './proposal.model.js';

const DUPLICATE_KEY = 11000;
const MINUTE_MS = 60_000;
const RELATED_WINDOW_MS = 30 * 24 * 60 * MINUTE_MS;

export const isStaff = (user: AuthPrincipal) => STAFF_ROLES.includes(user.role);
export const actorOf = (user: AuthPrincipal): Actor => ({ id: String(user.id), name: user.name });

export function createCaseService(dispatcher: InvestigationDispatcher) {
  /** Loads a case the user may see. Customers get 404 for other people's cases (no existence leak). */
  async function loadVisibleCase(user: AuthPrincipal, caseId: number): Promise<CaseDoc> {
    const filter = isStaff(user) ? { _id: caseId } : { _id: caseId, userId: user.id };
    const found = await CaseModel.findOne(filter).lean<CaseDoc>();
    if (!found) throw new NotFoundError('Case', caseId);
    return found;
  }

  return {
    loadVisibleCase,

    async create(user: AuthPrincipal, input: CreateCaseInput) {
      const txn = await transactionRepository.findByIdForUser(input.transactionId, user.id);
      if (!txn) throw new NotFoundError('Transaction', input.transactionId);
      const created = await insertCase(user, input, dispatcher.newRunId()).catch((err: unknown) => {
        if ((err as { code?: number }).code === DUPLICATE_KEY) throw new CaseAlreadyOpenError(input.transactionId);
        throw err;
      });
      metrics.casesCreated.inc();
      logger.info({ event: 'CASE_CREATED', caseId: created._id, userId: user.id, issueType: input.issueType }, 'Case created');
      await dispatcher.dispatch({ caseId: created._id, reason: 'CASE_CREATED' }, created.agentRunId!);
      return { id: created._id, status: created.status, createdAt: created.createdAt.toISOString() };
    },

    async list(user: AuthPrincipal, query: ListCasesQuery, page: PageQuery) {
      const match: Record<string, unknown> = isStaff(user) ? {} : { userId: user.id };
      if (query.status.length) match.status = { $in: query.status };
      if (query.issueType.length) match.issueType = { $in: query.issueType };
      const idSearch = Number(query.q?.replace(/^#/, ''));
      if (query.q && Number.isSafeInteger(idSearch)) match._id = idSearch;
      const [result] = await CaseModel.aggregate<{ items: CaseListRow[]; total: { n: number }[] }>(
        listPipeline(match, query.sort, page),
      );
      const now = Date.now();
      const items = (result?.items ?? []).map((row) => toListItem(row, now));
      return toPage(items, page, result?.total[0]?.n ?? 0);
    },

    async get(user: AuthPrincipal, caseId: number) {
      const caseDoc = await loadVisibleCase(user, caseId);
      const staffView = isStaff(user);
      const transaction = await transactionRepository.findById(caseDoc.transactionId);
      if (!transaction) throw new NotFoundError('Transaction', caseDoc.transactionId);
      const [proposal, decision, refund, audit, notes, related, customer] = await Promise.all([
        latestProposal(caseId),
        decisionWithApprover(caseId),
        refundService.findByCaseId(caseId),
        auditService.listForCase(caseId),
        staffView ? NoteModel.find({ caseId }).sort({ createdAt: 1 }).lean() : Promise.resolve([]),
        staffView
          ? transactionRepository.findRecentForUser(caseDoc.userId, new Date(transaction.createdAt.getTime() - RELATED_WINDOW_MS))
          : Promise.resolve([]),
        staffView ? userRepository.findById(caseDoc.userId) : Promise.resolve(null),
      ]);
      return toCaseDetail(
        { caseDoc, transaction, customerName: customer?.name ?? '', proposal, decision, refund, audit, notes, related },
        staffView,
      );
    },

    async addNote(user: AuthPrincipal, caseId: number, body: string) {
      const caseDoc = await loadVisibleCase(user, caseId);
      const note = await withTransaction(async (session) => {
        const [created] = await NoteModel.create([{ caseId, authorId: user.id, authorName: user.name, body }], { session });
        await auditService.record(
          { caseId, actor: actorOf(user), action: 'NOTE_ADDED', fromStatus: caseDoc.status, toStatus: caseDoc.status },
          session,
        );
        return created!.toObject();
      });
      return toNoteView(note);
    },

    /** Ops writes or edits the proposal; moves NEEDS_MANUAL_REVIEW → PROPOSED (or stays PROPOSED). */
    async updateProposal(user: AuthPrincipal, caseId: number, input: UpdateProposalInput) {
      const caseDoc = await loadVisibleCase(user, caseId);
      const txn = await transactionRepository.findById(caseDoc.transactionId);
      if (!txn) throw new NotFoundError('Transaction', caseDoc.transactionId);
      const amountPaise = normaliseProposalAmount(input, txn.amountPaise);
      const proposal = await withTransaction(async (session) => {
        const [created] = await ProposalModel.create(
          [{ caseId, action: input.action, amountPaise, reasons: input.reasons, confidence: null, createdBy: String(user.id) }],
          { session },
        );
        const action = caseDoc.status === CaseStatus.PROPOSED ? 'PROPOSAL_UPDATED' : 'PROPOSAL_CREATED';
        await transitionCase(
          caseDoc,
          { to: CaseStatus.PROPOSED, actor: actorOf(user), action, details: { action: input.action, amount: formatPaise(amountPaise) } },
          session,
        );
        return created!.toObject() as ProposalDoc;
      });
      metrics.proposalsCreated.inc({ source: 'human' });
      return toProposalResponse(proposal, true);
    },

    /** Re-runs the AI on OPEN, PROPOSED or NEEDS_MANUAL_REVIEW cases; the state machine rejects others. */
    async rerunAgent(user: AuthPrincipal, caseId: number) {
      const caseDoc = await loadVisibleCase(user, caseId);
      const runId = dispatcher.newRunId();
      const updated = await withTransaction((session) =>
        transitionCase(
          caseDoc,
          { to: CaseStatus.INVESTIGATING, actor: actorOf(user), action: 'AGENT_RERUN_REQUESTED', extraSet: { agentRunId: runId } },
          session,
        ),
      );
      await dispatcher.dispatch({ caseId, reason: 'RERUN' }, runId);
      return { status: updated.status };
    },

    async audit(user: AuthPrincipal, caseId: number) {
      await loadVisibleCase(user, caseId);
      return (await auditService.listForCase(caseId)).map(toAuditView);
    },

    /** For the transactions list: which of these transactions have an open case, and which case. */
    async openCasesFor(transactionIds: number[]): Promise<Map<number, number>> {
      if (transactionIds.length === 0) return new Map();
      const open = await CaseModel.find({ transactionId: { $in: transactionIds }, isOpen: true }, { transactionId: 1 }).lean<CaseDoc[]>();
      return new Map(open.map((c) => [c.transactionId, c._id]));
    },
  };
}

export type CaseService = ReturnType<typeof createCaseService>;

async function insertCase(user: AuthPrincipal, input: CreateCaseInput, agentRunId: string): Promise<CaseDoc> {
  return withTransaction(async (session) => {
    const _id = await nextSequence('cases', session);
    const [created] = await CaseModel.create(
      [
        {
          _id,
          userId: user.id,
          transactionId: input.transactionId,
          issueType: input.issueType,
          description: input.description || null,
          status: CaseStatus.OPEN,
          isOpen: true,
          agentRunId,
        },
      ],
      { session },
    );
    await auditService.record(
      { caseId: _id, actor: actorOf(user), action: 'CASE_CREATED', fromStatus: null, toStatus: CaseStatus.OPEN, details: { issueType: input.issueType } },
      session,
    );
    return created!.toObject() as CaseDoc;
  });
}

function normaliseProposalAmount(input: UpdateProposalInput, txnAmountPaise: number): number {
  if (input.action === ProposalAction.REJECT) return 0;
  const amountPaise = rupeesToPaise(input.amount);
  if (amountPaise > txnAmountPaise) {
    throw new AmountExceedsTransactionError(formatPaise(amountPaise), formatPaise(txnAmountPaise));
  }
  return input.action === ProposalAction.FULL_REFUND ? txnAmountPaise : amountPaise;
}

export async function latestProposal(caseId: number): Promise<ProposalDoc | null> {
  return ProposalModel.findOne({ caseId }).sort({ createdAt: -1, _id: -1 }).lean<ProposalDoc>();
}

async function decisionWithApprover(caseId: number) {
  const decision = await DecisionModel.findOne({ caseId }).lean<DecisionDoc>();
  if (!decision) return null;
  const approver = await userRepository.findById(decision.approverId);
  return { ...decision, approverName: approver?.name ?? 'Approver' };
}

interface CaseListRow {
  _id: number;
  status: string;
  issueType: string;
  createdAt: Date;
  updatedAt: Date;
  transactionId: number;
  customer?: { name: string };
  txn?: { amountPaise: number; merchant: string };
}

function listPipeline(match: Record<string, unknown>, sort: 'oldest' | 'newest', page: PageQuery): PipelineStage[] {
  const direction = sort === 'oldest' ? 1 : -1;
  return [
    { $match: match },
    {
      $facet: {
        items: [
          { $sort: { createdAt: direction, _id: direction } },
          { $skip: page.page * page.size },
          { $limit: page.size },
          { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'customer', pipeline: [{ $project: { name: 1 } }] } },
          { $lookup: { from: 'transactions', localField: 'transactionId', foreignField: '_id', as: 'txn', pipeline: [{ $project: { amountPaise: 1, merchant: 1 } }] } },
          { $set: { customer: { $first: '$customer' }, txn: { $first: '$txn' } } },
        ],
        total: [{ $count: 'n' }],
      },
    },
  ];
}

function toListItem(row: CaseListRow, now: number) {
  return {
    id: row._id,
    customerName: row.customer?.name ?? '',
    amount: row.txn ? paiseToRupees(row.txn.amountPaise) : 0,
    merchant: row.txn?.merchant ?? '',
    transactionId: row.transactionId,
    issueType: row.issueType,
    status: row.status,
    ageMinutes: Math.max(0, Math.floor((now - new Date(row.createdAt).getTime()) / MINUTE_MS)),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}
