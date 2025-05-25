import { User } from 'src/drizzle/schema';
import { UserProtected } from '../../user/user.interface';

export interface LoginResponse extends UserProtected {}

export interface GetLoggedInUserResponse extends UserProtected {}

export interface RegisterResponse {
  userId: User['userId'];
}
