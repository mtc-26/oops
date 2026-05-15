import { Schema, model, InferSchemaType } from 'mongoose';
import { nextSeq, formatId } from './counter.js';

const systemSchema = new Schema(
  {
    systemID: { type: String, required: true, unique: true, index: true },
    systemName: { type: String, required: true, maxlength: 100 },
  },
  { timestamps: true },
);

systemSchema.pre('validate', async function () {
  if (!this.systemID) {
    const seq = await nextSeq('system');
    this.systemID = formatId('S', seq, 4);
  }
});

export type SystemOfUsersDoc = InferSchemaType<typeof systemSchema> & { _id: any };
export const SystemOfUsers = model('SystemOfUsers', systemSchema);
