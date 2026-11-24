import { defineConfig } from 'vitest/config';

const testEnv = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  JWT_SECRET: 'test-secret-test-secret-test-secret-123',
  CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
  LLM_PROVIDER: 'mock',
  RUN_WORKER_INLINE: 'false',
};

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/unit/**/*.test.ts'],
          env: testEnv,
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          include: ['test/integration/**/*.it.test.ts'],
          setupFiles: ['./test/integration/setup.ts'],
          fileParallelism: false,
          testTimeout: 30000,
          hookTimeout: 30000,
          env: {
            ...testEnv,
            MONGODB_URI:
              process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/refunddesk_test?replicaSet=rs0&directConnection=true',
            REDIS_URL: process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6379/2',
            LOGIN_RATE_LIMIT_PER_MIN: '5',
          },
        },
      },
      {
        test: {
          name: 'eval',
          environment: 'node',
          include: ['test/eval/**/*.eval.test.ts'],
          testTimeout: 600000,
          env: { JWT_SECRET: testEnv.JWT_SECRET, LOG_LEVEL: 'silent', NODE_ENV: 'test' },
        },
      },
    ],
  },
});
