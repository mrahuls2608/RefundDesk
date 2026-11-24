import mongoose, { Schema, Types } from 'mongoose';

export interface AuditEntryDoc {
  _id: Types.ObjectId;
  caseId: number | null;
  /** User id as a string, or 'SYSTEM' / 'AGENT'. */
  actorId: string;
  actorName: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
}

const AuditEntrySchema = new Schema<AuditEntryDoc>(
  {
    caseId: { type: Number, default: null, ref: 'Case' },
    actorId: { type: String, required: true, maxlength: 40 },
    actorName: { type: String, required: true, maxlength: 100 },
    action: { type: String, required: true, maxlength: 50 },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, default: null },
    details: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

AuditEntrySchema.index({ caseId: 1, createdAt: 1, _id: 1 });

/** Append-only: any attempt to update or delete audit entries fails loudly. */
const MUTATING_QUERIES = [
  'updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'findOneAndReplace',
  'deleteOne', 'deleteMany', 'findOneAndDelete',
] as const;
for (const op of MUTATING_QUERIES) {
  AuditEntrySchema.pre(op, function rejectMutation() {
    throw new Error('audit_log is append-only');
  });
}

export const AuditEntryModel =
  (mongoose.models.AuditEntry as mongoose.Model<AuditEntryDoc>) ??
  mongoose.model<AuditEntryDoc>('AuditEntry', AuditEntrySchema, 'audit_log');
