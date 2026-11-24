import mongoose, { Schema, Types } from 'mongoose';

export const RefundStatus = { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' } as const;
export type RefundStatus = (typeof RefundStatus)[keyof typeof RefundStatus];

export interface RefundDoc {
  _id: Types.ObjectId;
  caseId: number;
  amountPaise: number;
  idempotencyKey: string;
  status: RefundStatus;
  createdAt: Date;
}

const RefundSchema = new Schema<RefundDoc>(
  {
    caseId: { type: Number, required: true, ref: 'Case' },
    amountPaise: { type: Number, required: true, min: 1 },
    idempotencyKey: { type: String, required: true, maxlength: 80 },
    status: { type: String, required: true, enum: Object.values(RefundStatus) },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

/** The real exactly-once guarantee: a second insert with the same key fails at the database. */
RefundSchema.index({ idempotencyKey: 1 }, { unique: true, name: 'ux_refund_idempotency_key' });
RefundSchema.index({ caseId: 1 });

export const RefundModel =
  (mongoose.models.Refund as mongoose.Model<RefundDoc>) ??
  mongoose.model<RefundDoc>('Refund', RefundSchema, 'refunds');
