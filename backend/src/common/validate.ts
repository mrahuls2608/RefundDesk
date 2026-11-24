import type { z } from 'zod';
import { ValidationError } from './errors.js';

/** Parses input with a Zod schema, throwing a VALIDATION_FAILED error with per-field messages. */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  throw new ValidationError(fields);
}

export const IdParamSchema = {
  parse(value: unknown): number {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new ValidationError({ id: 'Must be a positive integer' });
    }
    return id;
  },
};
