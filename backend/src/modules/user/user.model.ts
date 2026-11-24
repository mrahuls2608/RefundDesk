import mongoose, { Schema } from 'mongoose';
import { ALL_ROLES, type Role } from './role.js';

export interface UserDoc {
  _id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

interface UserRecord extends UserDoc {
  passwordHash: string;
}

const UserSchema = new Schema<UserRecord>(
  {
    _id: { type: Number, required: true },
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ALL_ROLES },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserRecord>) ?? mongoose.model<UserRecord>('User', UserSchema, 'users');
