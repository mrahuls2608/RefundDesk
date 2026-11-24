import mongoose from 'mongoose';
import { afterAll, beforeAll } from 'vitest';
import { connectDb } from '../../src/infra/db.js';
import { closeQueues } from '../../src/infra/queue.js';
import { closeRedis, getRedis } from '../../src/infra/redis.js';
import { seedDemoData } from '../../src/seed/seedData.js';

/** Real MongoDB (replica set, for transactions) and Redis. Each test file starts from a clean seed. */
beforeAll(async () => {
  await connectDb();
  await mongoose.connection.db!.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  await getRedis().flushdb();
  await seedDemoData();
});

afterAll(async () => {
  await closeQueues();
  await closeRedis();
  await mongoose.disconnect();
});
