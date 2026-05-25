import { Schema, model, InferSchemaType } from 'mongoose';
import { randomBytes } from 'node:crypto';

const usersecretSchema = new Schema(
  {
    usersecretId: { type: String, required: true, unique: true, index: true },
    uid: { type: String, required: true, index: true },
    systemName: { type: String, required: true, maxlength: 100 },
    secretName: { type: String, required: true, maxlength: 100 },
    secretDescription: { type: String, default: '', maxlength: 500 },
    secretValue: { type: String, required: true },
    picture: { type: String, default: '' },
  },
  { timestamps: true },
);

usersecretSchema.pre('validate', function () {
  if (!this.usersecretId) {
    this.usersecretId = randomBytes(5).toString('hex');
  }
});

export type UsersecretDoc = InferSchemaType<typeof usersecretSchema> & { _id: any };
export const Usersecret = model('Usersecret', usersecretSchema, 'Usersecret');
