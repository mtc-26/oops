import { Schema, model } from 'mongoose';

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const CounterModel = model('Counter', counterSchema);

export async function nextSeq(name: string): Promise<number> {
  const doc = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return doc!.seq;
}

export function formatId(prefix: string, n: number, width: number): string {
  return `${prefix}${String(n).padStart(width, '0')}`;
}
