import mongoose, { Schema } from 'mongoose';

export const TransactionStatus = { SUCCESS: 'SUCCESS', FAILED: 'FAILED', PENDING: 'PENDING' } as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export interface TransactionDoc {
  _id: number;
  userId: number;
  amountPaise: number;
  currency: string;
  merchant: string;
  status: TransactionStatus;
  createdAt: Date;
}

const TransactionSchema = new Schema<TransactionDoc>(
  {
    _id: { type: Number, required: true },
    userId: { type: Number, required: true, ref: 'User' },
    amountPaise: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
    currency: { type: String, required: true, default: 'INR', minlength: 3, maxlength: 3 },
    merchant: { type: String, required: true, maxlength: 120 },
    status: { type: String, required: true, enum: Object.values(TransactionStatus) },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

TransactionSchema.index({ userId: 1, createdAt: -1 });

export const TransactionModel =
  (mongoose.models.Transaction as mongoose.Model<TransactionDoc>) ??
  mongoose.model<TransactionDoc>('Transaction', TransactionSchema, 'transactions');
