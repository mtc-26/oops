import { Schema, model, InferSchemaType } from 'mongoose';

export const VAULT_CATEGORIES = [
  'social',
  'banking',
  'entertainment',
  'education',
  'books',
  'games',
  'other',
] as const;
export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

const vaultSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    systemName: { type: String, required: true }, // plaintext: "Facebook", "Gmail"
    category: { type: String, enum: VAULT_CATEGORIES, default: 'other', required: true },
    color: { type: String, default: '#7a8597' }, // brand color for UI tile
    // Encrypted payload: stringified JSON {username, password, pin, qr, other}
    ciphertext: { type: String, required: true }, // base64
    iv: { type: String, required: true }, // base64 (12 bytes for AES-GCM)
  },
  { timestamps: true },
);

export type VaultDoc = InferSchemaType<typeof vaultSchema> & { _id: any };
export const Vault = model('Vault', vaultSchema);
