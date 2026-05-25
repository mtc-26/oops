import { Schema, model, InferSchemaType } from 'mongoose';
import { randomBytes } from 'node:crypto';

const dictionarySchema = new Schema(
  {
    did: { type: String, required: true, unique: true, index: true },
    dictfile: { type: String, required: true, maxlength: 255 },
    dictname: { type: String, required: true, maxlength: 100 },
  },
  { timestamps: true },
);

dictionarySchema.pre('validate', function () {
  if (!this.did) {
    this.did = randomBytes(4).toString('hex');
  }
});

export type DictionaryDoc = InferSchemaType<typeof dictionarySchema> & { _id: any };
export const Dictionary = model('Dictionary', dictionarySchema, 'Dictionary');
