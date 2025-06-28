import { User } from '../drizzle/schema';

export type UserProtected = Omit<
  User,
  'password' | 'refreshToken' | 'createdDate' | 'updatedDate'
>;
