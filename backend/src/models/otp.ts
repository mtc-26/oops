import { Schema, model, InferSchemaType } from 'mongoose';
import { randomBytes } from 'node:crypto';

export const OTP_PURPOSES = ['register', 'login', 'reset_motp'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

const otpSchema = new Schema(
  {
    oid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: OTP_PURPOSES, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    fullName: { type: String },
    phone: { type: String },
    otpSecret: { type: String },
    stage: { type: String, enum: ['email', 'totp'], default: 'email' },
  },
  { timestamps: true },
);

otpSchema.pre('validate', function () {
  if (!this.oid) {
    this.oid = randomBytes(5).toString('hex');
  }
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpDoc = InferSchemaType<typeof otpSchema> & { _id: any };
export const OtpCode = model('OtpCode', otpSchema, 'Otpcodes');
