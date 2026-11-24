import mongoose, { type ClientSession } from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../common/logger.js';

mongoose.set('strictQuery', true);

export async function connectDb(uri = env.MONGODB_URI): Promise<typeof mongoose> {
  const connection = await mongoose.connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 });
  logger.info({ event: 'DB_CONNECTED' }, 'MongoDB connected');
  return connection;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

/**
 * Runs `work` inside a MongoDB multi-document transaction (requires a replica set).
 * Used so a case status change and its audit entry commit or roll back together.
 */
export async function withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}
