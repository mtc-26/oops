import { Schema, model, InferSchemaType } from 'mongoose';
import { nextSeq } from './counter.js';

const secretAndValueSchema = new Schema(
  {
    secretandvalueId: { type: String, required: true, unique: true, index: true },
    secretName: { type: String, required: true, maxlength: 50 },
    value: { type: String, required: true },
    systemID: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

secretAndValueSchema.pre('validate', async function () {
  if (!this.secretandvalueId) {
    const seq = await nextSeq('secretAndValue');
    this.secretandvalueId = `SV${String(seq).padStart(3, '0')}`;
  }
});

export type SecretAndValueDoc = InferSchemaType<typeof secretAndValueSchema> & { _id: any };
export const SecretAndValue = model('SecretAndValue', secretAndValueSchema);
