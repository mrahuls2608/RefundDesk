import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../infra/db.js';
import { DEMO_PASSWORD, DEMO_USERS, seedDemoData } from './seedData.js';

/** Idempotent demo seed (local / demo only). Re-running refreshes transaction times. */
async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Refusing to seed in production without ALLOW_DEMO_SEED=true');
  }
  await connectDb();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  await seedDemoData();
  process.stdout.write(`Seeded ${DEMO_USERS.length} demo users (password ${DEMO_PASSWORD}):\n`);
  for (const u of DEMO_USERS) process.stdout.write(`  ${u.role.padEnd(9)} ${u.email}\n`);
  await disconnectDb();
}

main().catch((err: unknown) => {
  process.stderr.write(`Seed failed: ${(err as Error).message}\n`);
  process.exit(1);
});
