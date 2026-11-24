import { getRedis } from '../../infra/redis.js';
import { logger } from '../../common/logger.js';
import { PolicyRuleModel, type PolicyRuleDoc } from './policy.model.js';

const CACHE_TTL_SECONDS = 60;
const cacheKey = (issueType: string) => `policy:active:${issueType}`;

/** Policy rules are read on every agent run, so active rules are cached in Redis for a minute. */
export const policyRepository = {
  async findActiveByIssueType(issueType: string): Promise<PolicyRuleDoc[]> {
    const cached = await readCache(issueType);
    if (cached) return cached;
    const rules = await PolicyRuleModel.find({ issueType, active: true }).sort({ _id: 1 }).lean<PolicyRuleDoc[]>().exec();
    await writeCache(issueType, rules);
    return rules;
  },

  listAll(): Promise<PolicyRuleDoc[]> {
    return PolicyRuleModel.find().sort({ issueType: 1, _id: 1 }).lean<PolicyRuleDoc[]>().exec();
  },

  async update(id: number, patch: Pick<PolicyRuleDoc, 'ruleText' | 'maxDays' | 'active'>): Promise<PolicyRuleDoc | null> {
    const updated = await PolicyRuleModel.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean<PolicyRuleDoc>().exec();
    if (updated) await getRedis().del(cacheKey(updated.issueType)).catch(() => 0);
    return updated;
  },
};

async function readCache(issueType: string): Promise<PolicyRuleDoc[] | null> {
  try {
    const raw = await getRedis().get(cacheKey(issueType));
    return raw ? (JSON.parse(raw) as PolicyRuleDoc[]) : null;
  } catch (err) {
    logger.warn({ err: (err as Error).message, event: 'POLICY_CACHE_READ_FAILED' }, 'Policy cache unavailable');
    return null;
  }
}

async function writeCache(issueType: string, rules: PolicyRuleDoc[]): Promise<void> {
  try {
    await getRedis().set(cacheKey(issueType), JSON.stringify(rules), 'EX', CACHE_TTL_SECONDS);
  } catch (err) {
    logger.warn({ err: (err as Error).message, event: 'POLICY_CACHE_WRITE_FAILED' }, 'Policy cache unavailable');
  }
}
