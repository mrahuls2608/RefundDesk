import { toPage, type Page, type PageQuery } from '../../common/pagination.js';
import { toTransactionResponse, type TransactionResponse } from './transaction.dto.js';
import { transactionRepository } from './transaction.repository.js';

/** Looks up open cases for a set of transactions; provided by casemgmt at composition time. */
export type OpenCaseLookup = (transactionIds: number[]) => Promise<Map<number, number>>;

export function createTransactionService(openCasesFor: OpenCaseLookup) {
  return {
    /** Customers only ever see their own transactions: the owner filter is part of the query. */
    async listForCustomer(userId: number, query: PageQuery): Promise<Page<TransactionResponse>> {
      const [txns, total] = await transactionRepository.pageForUser(userId, query.page * query.size, query.size);
      const openCases = await openCasesFor(txns.map((t) => t._id));
      const items = txns.map((t) => toTransactionResponse(t, openCases.get(t._id) ?? null));
      return toPage(items, query, total);
    },
  };
}

export type TransactionService = ReturnType<typeof createTransactionService>;
