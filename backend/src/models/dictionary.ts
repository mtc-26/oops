import { Schema, model, InferSchemaType } from 'mongoose';
import { nextSeq, formatId } from './counter.js';

const dictionarySchema = new Schema(
  {
    did: { type: String, required: true, unique: true, index: true },
    rockyou: { type: String, required: true, maxlength: 50 },
    hibp: { type: String, required: true, maxlength: 255 },
  },
  { timestamps: true },
);

dictionarySchema.pre('validate', async function () {
  if (!this.did) {
    const seq = await nextSeq('dictionary');
    this.did = formatId('D', seq, 4);
  }
});

export type DictionaryDoc = InferSchemaType<typeof dictionarySchema> & { _id: any };
export const Dictionary = model('Dictionary', dictionarySchema);
