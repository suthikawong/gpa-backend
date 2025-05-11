import { users } from '../../drizzle/schema';

type User = typeof users.$inferSelect;
type UserOmit = Omit<User, 'password' | 'refreshToken'>;

export type GetUserByIdResponse = UserOmit | null;

export interface CreateUserResponse extends UserOmit {}

export interface UpdateUserResponse extends UserOmit {}
