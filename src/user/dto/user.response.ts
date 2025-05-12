import { User } from '../../drizzle/schema';
import { UserProtected } from '../user.interface';

export interface GetUserByIdResponse extends User {}

export interface GetLoggedInUserResponse extends UserProtected {}

export interface GetUserByEmailResponse extends User {}

export interface CreateUserResponse extends UserProtected {}

export interface UpdateUserResponse extends UserProtected {}
