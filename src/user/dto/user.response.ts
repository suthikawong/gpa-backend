import { User } from '../../drizzle/schema';

type UserOmit = Omit<User, 'password' | 'refreshToken'>;

export interface GetUserByIdResponse extends User {}

export interface GetUserByEmailResponse extends User {}

export interface CreateUserResponse extends UserOmit {}

export interface UpdateUserResponse extends UserOmit {}
