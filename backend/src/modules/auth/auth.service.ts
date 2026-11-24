import bcrypt from 'bcryptjs';
import { AppError, ErrorCode, NotFoundError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { jwtService } from '../../security/jwt.js';
import type { Role } from '../user/role.js';
import { userRepository } from '../user/user.repository.js';

export const BCRYPT_STRENGTH = 10;

/** Compared against when the email is unknown, so response time doesn't reveal which emails exist. */
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', BCRYPT_STRENGTH);

export interface LoginResult {
  accessToken: string;
  expiresIn: number;
  user: { id: number; name: string; role: Role };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await userRepository.findByEmailWithHash(email);
    const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !matches) {
      logger.info({ event: 'LOGIN_FAILED' }, 'Login failed');
      throw new AppError(ErrorCode.UNAUTHENTICATED, 'Email or password is incorrect');
    }
    const principal = { id: user._id, role: user.role as Role, name: user.name };
    logger.info({ event: 'LOGIN_SUCCEEDED', userId: user._id }, 'Login succeeded');
    return { accessToken: jwtService.sign(principal), expiresIn: jwtService.ttlSeconds, user: principal };
  },

  async me(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User', userId);
    return { id: user._id, name: user.name, email: user.email, role: user.role as Role };
  },

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_STRENGTH);
  },
};
