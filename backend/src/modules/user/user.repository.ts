import type { ClientSession } from 'mongoose';
import { nextSequence } from '../../infra/sequence.js';
import type { Role } from './role.js';
import { UserModel, type UserDoc } from './user.model.js';

export type UserWithHash = UserDoc & { passwordHash: string };

export const userRepository = {
  findById(id: number): Promise<UserDoc | null> {
    return UserModel.findById(id).lean<UserDoc>().exec();
  },

  findByEmailWithHash(email: string): Promise<UserWithHash | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash').lean<UserWithHash>().exec();
  },

  findNamesByIds(ids: number[]): Promise<Pick<UserDoc, '_id' | 'name' | 'role'>[]> {
    return UserModel.find({ _id: { $in: ids } }, { name: 1, role: 1 }).lean<UserDoc[]>().exec();
  },

  listAll(): Promise<UserDoc[]> {
    return UserModel.find().sort({ _id: 1 }).lean<UserDoc[]>().exec();
  },

  async create(
    input: { name: string; email: string; passwordHash: string; role: Role },
    session?: ClientSession,
  ): Promise<UserDoc> {
    const _id = await nextSequence('users', session);
    const [created] = await UserModel.create([{ _id, ...input }], { session });
    const { passwordHash: _omit, ...user } = created!.toObject() as UserWithHash;
    return user as UserDoc;
  },
};
