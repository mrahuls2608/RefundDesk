import mongoose, { Schema, Types } from 'mongoose';

export const DecisionType = { APPROVE: 'APPROVE', REJECT: 'REJECT' } as const;
export type DecisionType = (typeof DecisionType)[keyof typeof DecisionType];

export interface DecisionDoc {
  _id: Types.ObjectId;
  caseId: number;
  approverId: number;
  decision: DecisionType;
  finalAmountPaise: number | null;
  comment: string;
  createdAt: Date;
}

const DecisionSchema = new Schema<DecisionDoc>(
  {
    caseId: { type: Number, required: true, ref: 'Case' },
    approverId: { type: Number, required: true, ref: 'User' },
    decision: { type: String, required: true, enum: Object.values(DecisionType) },
    finalAmountPaise: { type: Number, min: 0, default: null },
    comment: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

DecisionSchema.index({ caseId: 1 }, { unique: true });

export const DecisionModel =
  (mongoose.models.Decision as mongoose.Model<DecisionDoc>) ??
  mongoose.model<DecisionDoc>('Decision', DecisionSchema, 'decisions');
