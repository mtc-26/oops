import { Schema, model, InferSchemaType } from 'mongoose';
import { nextSeq, formatId } from './counter.js';

const secretVaultSchema = new Schema(
  {
    vid: { type: String, required: true, unique: true, index: true },
    uid: { type: String, required: true, index: true },
    systemID: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

secretVaultSchema.index({ uid: 1, systemID: 1 }, { unique: true });

secretVaultSchema.pre('validate', async function () {
  if (!this.vid) {
    const seq = await nextSeq('secretVault');
    this.vid = formatId('V', seq, 4);
  }
});

export type SecretVaultDoc = InferSchemaType<typeof secretVaultSchema> & { _id: any };
export const SecretVault = model('SecretVault', secretVaultSchema);
