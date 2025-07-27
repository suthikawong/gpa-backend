import { User } from '../drizzle/schema';

export type UserProtected = Omit<
  User,
  | 'password'
  | 'refreshToken'
  | 'isVerified'
  | 'verificationToken'
  | 'resetPasswordToken'
  | 'createdDate'
  | 'updatedDate'
>;
