import mongoose, { Schema } from 'mongoose';
import { ALL_CASE_STATUSES, ALL_ISSUE_TYPES, CaseStatus, type IssueType } from './caseStatus.js';

export interface CaseDoc {
  _id: number;
  userId: number;
  transactionId: number;
  issueType: IssueType;
  description: string | null;
  status: CaseStatus;
  /** Denormalised `status !== CLOSED`; backs the "one open case per transaction" unique index. */
  isOpen: boolean;
  /** Optimistic-locking version, incremented on every status change. */
  version: number;
  agentRunId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<CaseDoc>(
  {
    _id: { type: Number, required: true },
    userId: { type: Number, required: true, ref: 'User' },
    transactionId: { type: Number, required: true, ref: 'Transaction' },
    issueType: { type: String, required: true, enum: ALL_ISSUE_TYPES },
    description: { type: String, maxlength: 1000, default: null },
    status: { type: String, required: true, enum: ALL_CASE_STATUSES },
    isOpen: { type: Boolean, required: true, default: true },
    version: { type: Number, required: true, default: 0 },
    agentRunId: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

CaseSchema.index(
  { transactionId: 1 },
  { unique: true, partialFilterExpression: { isOpen: true }, name: 'ux_open_case_per_txn' },
);
CaseSchema.index({ status: 1, createdAt: 1 });
CaseSchema.index({ userId: 1, createdAt: -1 });

export const CaseModel =
  (mongoose.models.Case as mongoose.Model<CaseDoc>) ?? mongoose.model<CaseDoc>('Case', CaseSchema, 'cases');

export const isOpenStatus = (status: CaseStatus) => status !== CaseStatus.CLOSED;
