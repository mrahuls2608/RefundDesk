import 'dotenv/config';
import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z.string().default('info'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/refunddesk?replicaSet=rs0&directConnection=true'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_TTL_MINUTES: z.coerce.number().int().positive().default(60),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  LOGIN_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(5),
  RUN_WORKER_INLINE: booleanString,
  LLM_PROVIDER: z.enum(['groq', 'gemini', 'ollama', 'mock']).default('mock'),
  LLM_API_KEY: z.string().default(''),
  LLM_MODEL: z.string().default('llama-3.3-70b-versatile'),
  LLM_BASE_URL: z.string().default(''),
  LLM_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
  LLM_MAX_CALLS_PER_CASE: z.coerce.number().int().min(1).max(3).default(3),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${problems}`);
  }
  return parsed.data;
}

export const env = loadEnv();

export const corsOrigins = env.CORS_ALLOWED_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const isProduction = env.NODE_ENV === 'production';
