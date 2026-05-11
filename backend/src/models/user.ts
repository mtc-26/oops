import { Schema, model, InferSchemaType } from 'mongoose';

export const ROLES = ['member', 'admin', 'superadmin'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: { type: String },
    role: { type: String, enum: ROLES, default: 'member', required: true },
    passwordHash: { type: String }, // only for admin/superadmin
    totpSecret: { type: String }, // Google Authenticator base32 secret
    totpVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },

    // Vault passphrase (Phase 3) — admin/server cannot derive the key
    passphraseSalt: { type: String }, // base64, random 16 bytes
    passphraseVerifier: { type: String }, // base64 ciphertext of known plaintext "OOPS_VERIFIER_V1"
    passphraseVerifierIv: { type: String }, // base64 IV for the verifier
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: any };
export const User = model('User', userSchema);
