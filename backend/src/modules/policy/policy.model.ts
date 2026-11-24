import mongoose, { Schema } from 'mongoose';

export interface PolicyRuleDoc {
  _id: number;
  issueType: string;
  ruleText: string;
  maxDays: number | null;
  active: boolean;
}

const PolicyRuleSchema = new Schema<PolicyRuleDoc>(
  {
    _id: { type: Number, required: true },
    issueType: { type: String, required: true, maxlength: 30 },
    ruleText: { type: String, required: true, maxlength: 1000 },
    maxDays: { type: Number, default: null },
    active: { type: Boolean, required: true, default: true },
  },
  { versionKey: false },
);

PolicyRuleSchema.index({ issueType: 1, active: 1 });

export const PolicyRuleModel =
  (mongoose.models.PolicyRule as mongoose.Model<PolicyRuleDoc>) ??
  mongoose.model<PolicyRuleDoc>('PolicyRule', PolicyRuleSchema, 'policy_rules');
