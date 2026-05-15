import { Schema, model, InferSchemaType } from 'mongoose';
import { nextSeq } from './counter.js';

export const ROLES = ['member', 'admin', 'super admin'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, index: true, maxlength: 100 },
    otpSecret: { type: String, required: true },
    password: { type: String },
    phone: { type: String },
    role: { type: String, enum: ROLES, default: 'member', required: true },
    disable: { type: Boolean, default: false, required: true },
  },
  { timestamps: true },
);

userSchema.pre('validate', async function () {
  if (!this.uid) {
    const seq = await nextSeq('user');
    this.uid = String(seq).padStart(5, '0');
  }
});

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: any };
export const User = model('User', userSchema);
