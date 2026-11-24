import { paiseToRupees } from '../../common/money.js';
import type { TransactionDoc } from './transaction.model.js';

export interface TransactionResponse {
  id: number;
  amount: number;
  currency: string;
  merchant: string;
  status: string;
  createdAt: string;
  hasOpenCase: boolean;
  openCaseId: number | null;
}

export function toTransactionResponse(txn: TransactionDoc, openCaseId: number | null = null): TransactionResponse {
  return {
    id: txn._id,
    amount: paiseToRupees(txn.amountPaise),
    currency: txn.currency,
    merchant: txn.merchant,
    status: txn.status,
    createdAt: txn.createdAt.toISOString(),
    hasOpenCase: openCaseId !== null,
    openCaseId,
  };
}
