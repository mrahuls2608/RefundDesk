import { TransactionModel, type TransactionDoc } from './transaction.model.js';

/** Read-only access. Used by the transactions API, case management and (read-only) agent tools. */
export const transactionRepository = {
  findById(id: number): Promise<TransactionDoc | null> {
    return TransactionModel.findById(id).lean<TransactionDoc>().exec();
  },

  findByIdForUser(id: number, userId: number): Promise<TransactionDoc | null> {
    return TransactionModel.findOne({ _id: id, userId }).lean<TransactionDoc>().exec();
  },

  findByIds(ids: number[]): Promise<TransactionDoc[]> {
    return TransactionModel.find({ _id: { $in: ids } }).lean<TransactionDoc[]>().exec();
  },

  async pageForUser(userId: number, skip: number, limit: number): Promise<[TransactionDoc[], number]> {
    const filter = { userId };
    return Promise.all([
      TransactionModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean<TransactionDoc[]>().exec(),
      TransactionModel.countDocuments(filter).exec(),
    ]);
  },

  findRecentForUser(userId: number, since: Date): Promise<TransactionDoc[]> {
    return TransactionModel.find({ userId, createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<TransactionDoc[]>()
      .exec();
  },
};
