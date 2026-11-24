import type { ClientSession } from 'mongoose';
import { logger } from '../../common/logger.js';
import { formatPaise } from '../../common/money.js';
import { metrics } from '../../metrics/metrics.js';
import { RefundModel, RefundStatus, type RefundDoc } from './refund.model.js';

const DUPLICATE_KEY = 11000;

export const refundKeyForCase = (caseId: number) => `case-${caseId}`;

/**
 * Executes a refund exactly once per idempotency key (TRD §7.2).
 * The unique index is the real guarantee; the lookup is an optimisation that returns the
 * original row on a repeated call. A concurrent insert that loses the race surfaces as E11000 and we return
 * the winner's row instead of creating a second refund.
 *
 * Golden rule: only DecisionService may call this (enforced by the architecture test).
 */
export const refundService = {
  async execute(caseId: number, amountPaise: number, idempotencyKey: string, session?: ClientSession): Promise<RefundDoc> {
    const existing = await findByKey(idempotencyKey, session);
    if (existing) return existing;
    try {
      const [created] = await RefundModel.create(
        [{ caseId, amountPaise, idempotencyKey, status: RefundStatus.SUCCESS }],
        { session },
      );
      const refund = created!.toObject() as RefundDoc;
      recordExecuted(refund);
      return refund;
    } catch (err) {
      if (isDuplicateKey(err)) {
        const winner = await findByKey(idempotencyKey, session);
        if (winner) return winner;
      }
      metrics.refunds.inc({ status: RefundStatus.FAILED });
      throw err;
    }
  },

  findByCaseId(caseId: number): Promise<RefundDoc | null> {
    return RefundModel.findOne({ caseId }).lean<RefundDoc>().exec();
  },
};

function findByKey(idempotencyKey: string, session?: ClientSession): Promise<RefundDoc | null> {
  return RefundModel.findOne({ idempotencyKey }).session(session ?? null).lean<RefundDoc>().exec();
}

function recordExecuted(refund: RefundDoc): void {
  metrics.refunds.inc({ status: refund.status });
  logger.info(
    { event: 'REFUND_EXECUTED', caseId: refund.caseId, amount: formatPaise(refund.amountPaise), key: refund.idempotencyKey },
    'Refund executed',
  );
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === DUPLICATE_KEY;
}
