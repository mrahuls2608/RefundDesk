import mongoose, { Schema, Types } from 'mongoose';
import { ALL_PROPOSAL_ACTIONS, type ProposalAction } from './caseStatus.js';

export const AGENT_ACTOR = 'AGENT';

export interface ProposalDoc {
  _id: Types.ObjectId;
  caseId: number;
  action: ProposalAction;
  amountPaise: number;
  reasons: string[];
  confidence: number | null;
  model: string | null;
  promptVersion: string | null;
  /** 'AGENT' or the staff user id as a string. */
  createdBy: string;
  createdAt: Date;
}

const ProposalSchema = new Schema<ProposalDoc>(
  {
    caseId: { type: Number, required: true, ref: 'Case' },
    action: { type: String, required: true, enum: ALL_PROPOSAL_ACTIONS },
    amountPaise: { type: Number, required: true, min: 0, default: 0 },
    reasons: { type: [String], required: true },
    confidence: { type: Number, min: 0, max: 1, default: null },
    model: { type: String, maxlength: 80, default: null },
    promptVersion: { type: String, maxlength: 20, default: null },
    createdBy: { type: String, required: true, maxlength: 40 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

ProposalSchema.index({ caseId: 1, createdAt: -1 });

export const ProposalModel =
  (mongoose.models.Proposal as mongoose.Model<ProposalDoc>) ??
  mongoose.model<ProposalDoc>('Proposal', ProposalSchema, 'proposals');
