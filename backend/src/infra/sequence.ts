import mongoose, { Schema, type ClientSession } from 'mongoose';

/**
 * Human-friendly numeric ids ("Case #42", idempotency key "case-42") from a counters
 * collection. `findOneAndUpdate` with `$inc` is atomic, so ids never collide.
 */
interface CounterDoc {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<CounterDoc>({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });
const Counter =
  (mongoose.models.Counter as mongoose.Model<CounterDoc>) ?? mongoose.model<CounterDoc>('Counter', CounterSchema, 'counters');

export async function nextSequence(name: string, session?: ClientSession): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session },
  ).lean<CounterDoc>();
  return counter!.seq;
}

/** Moves a counter forward so seeded documents with explicit ids don't clash with new ones. */
export async function ensureSequenceAtLeast(name: string, value: number): Promise<void> {
  await Counter.updateOne({ _id: name }, { $max: { seq: value } }, { upsert: true });
}
