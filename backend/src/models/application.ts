import { Schema, model, InferSchemaType } from 'mongoose';
import { nextSeq } from './counter.js';

const applicationSchema = new Schema(
  {
    aid: { type: String, required: true, unique: true, index: true },
    appName: { type: String, required: true, maxlength: 100 },
    group: { type: String, required: true, maxlength: 50 },
  },
  { timestamps: true },
);

applicationSchema.pre('validate', async function () {
  if (!this.aid) {
    const seq = await nextSeq('application');
    this.aid = String(seq).padStart(4, '0');
  }
});

export type ApplicationDoc = InferSchemaType<typeof applicationSchema> & { _id: any };
export const Application = model('Application', applicationSchema);
