import { users } from '../../drizzle/schema';

type User = typeof users.$inferSelect;
type UserOmit = Omit<User, 'password' | 'refreshToken'>;

export interface GetUserByIdResponse extends UserOmit {}

export interface CreateUserResponse extends UserOmit {}

export interface UpdateUserResponse extends UserOmit {}
