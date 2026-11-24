import bcrypt from 'bcryptjs';
import { BCRYPT_STRENGTH } from '../modules/auth/auth.service.js';
import { PolicyRuleModel } from '../modules/policy/policy.model.js';
import { TransactionModel, type TransactionStatus } from '../modules/transaction/transaction.model.js';
import { UserModel } from '../modules/user/user.model.js';
import { Role } from '../modules/user/role.js';
import { ensureSequenceAtLeast } from '../infra/sequence.js';

/** Mock data only: invented names, @demo.in emails, no real payment details. */
export const DEMO_PASSWORD = 'Demo@123';

export const DEMO_USERS = [
  { _id: 1, name: 'Asha', email: 'asha@demo.in', role: Role.CUSTOMER },
  { _id: 2, name: 'Rahul', email: 'rahul@demo.in', role: Role.CUSTOMER },
  { _id: 3, name: 'Ravi', email: 'ravi@demo.in', role: Role.OPS },
  { _id: 4, name: 'Priya', email: 'priya@demo.in', role: Role.APPROVER },
  { _id: 5, name: 'Admin', email: 'admin@demo.in', role: Role.ADMIN },
] as const;

export const POLICY_RULES = [
  { _id: 1, issueType: 'DUPLICATE_CHARGE', ruleText: 'If two SUCCESS charges with the same merchant and amount occur within 10 minutes, refund the later charge in full.', maxDays: 30 },
  { _id: 2, issueType: 'FAILED_BUT_DEBITED', ruleText: 'If the transaction status is FAILED and the customer reports a debit, refund the full amount.', maxDays: 30 },
  { _id: 3, issueType: 'WRONG_AMOUNT', ruleText: 'Refund only the verified difference between the charged and the agreed amount. If it cannot be verified, send to manual review.', maxDays: 15 },
  { _id: 4, issueType: 'OTHER', ruleText: 'No automatic refund rule. Investigate and propose with low confidence.', maxDays: 30 },
] as const;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

type SeedTxn = [id: number, userId: number, rupees: number, merchant: string, status: TransactionStatus, agoMs: number];

/** Times are relative to "now" so the data always falls inside the 30-day window. */
function seedTransactions(): SeedTxn[] {
  const base = 2 * DAY;
  return [
    // Asha: duplicate charge pair 40 s apart (case target = 101)
    [100, 1, 499, 'FoodNow', 'SUCCESS', base + 40_000],
    [101, 1, 499, 'FoodNow', 'SUCCESS', base],
    // Asha: failed but debited
    [102, 1, 1200, 'QuickRail', 'FAILED', 3 * DAY],
    // Asha: a second duplicate pair, 3 minutes apart
    [103, 1, 2499, 'ShopKart', 'SUCCESS', 5 * DAY + 3 * MINUTE],
    [104, 1, 2499, 'ShopKart', 'SUCCESS', 5 * DAY],
    // Asha: normal history
    [105, 1, 149, 'StreamPlus', 'SUCCESS', 1 * DAY],
    [106, 1, 89.5, 'ChaiPoint', 'SUCCESS', 6 * 60 * MINUTE],
    [107, 1, 650, 'MediCare Pharmacy', 'SUCCESS', 4 * DAY],
    [108, 1, 320, 'CityCab', 'SUCCESS', 6 * DAY],
    [109, 1, 999, 'FitZone', 'PENDING', 7 * DAY],
    [110, 1, 75, 'ChaiPoint', 'SUCCESS', 8 * DAY],
    [111, 1, 1899, 'ShopKart', 'SUCCESS', 9 * DAY],
    [112, 1, 499, 'FoodNow', 'SUCCESS', 10 * DAY],
    [113, 1, 230, 'BookNest', 'SUCCESS', 11 * DAY],
    [114, 1, 3400, 'AirGo', 'FAILED', 12 * DAY],
    [115, 1, 120, 'CityCab', 'SUCCESS', 13 * DAY],
    [116, 1, 560, 'FoodNow', 'SUCCESS', 15 * DAY],
    [117, 1, 45, 'ChaiPoint', 'SUCCESS', 18 * DAY],
    [118, 1, 799, 'StreamPlus', 'SUCCESS', 21 * DAY],
    [119, 1, 1500, 'PowerGrid Electricity', 'SUCCESS', 25 * DAY],
    // Rahul: separate customer (ownership tests), incl. a failed-but-debited
    [200, 2, 1200, 'QuickRail', 'FAILED', 2 * 60 * MINUTE],
    [201, 2, 350, 'FoodNow', 'SUCCESS', 1 * DAY],
    [202, 2, 350, 'FoodNow', 'SUCCESS', 1 * DAY + 30_000],
    [203, 2, 99, 'StreamPlus', 'SUCCESS', 3 * DAY],
    [204, 2, 2100, 'ShopKart', 'SUCCESS', 4 * DAY],
    [205, 2, 180, 'CityCab', 'SUCCESS', 6 * DAY],
    [206, 2, 640, 'BookNest', 'SUCCESS', 9 * DAY],
    [207, 2, 1250, 'AirGo', 'SUCCESS', 14 * DAY],
    [208, 2, 60, 'ChaiPoint', 'SUCCESS', 20 * DAY],
    [209, 2, 2750, 'MediCare Pharmacy', 'FAILED', 22 * DAY],
  ];
}

export async function seedDemoData(now = new Date()): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_STRENGTH);
  await UserModel.bulkWrite(
    DEMO_USERS.map((u) => ({ updateOne: { filter: { _id: u._id }, update: { $set: { ...u, passwordHash } }, upsert: true } })),
  );
  await PolicyRuleModel.bulkWrite(
    POLICY_RULES.map((r) => ({ updateOne: { filter: { _id: r._id }, update: { $setOnInsert: { ...r, active: true } }, upsert: true } })),
  );
  await TransactionModel.bulkWrite(
    seedTransactions().map(([_id, userId, rupees, merchant, status, agoMs]) => ({
      updateOne: {
        filter: { _id },
        update: {
          $set: {
            userId,
            amountPaise: Math.round(rupees * 100),
            currency: 'INR',
            merchant,
            status,
            createdAt: new Date(now.getTime() - agoMs),
          },
        },
        upsert: true,
      },
    })),
  );
  await ensureSequenceAtLeast('users', 100);
  await ensureSequenceAtLeast('transactions', 1000);
}
