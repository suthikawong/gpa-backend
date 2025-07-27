import { User } from '../../drizzle/schema';
import { UserProtected } from '../../user/user.interface';

export interface LoginResponse extends UserProtected {}

export interface GetLoggedInUserResponse extends UserProtected {}

export interface RegisterResponse {
  userId: User['userId'];
}

export interface VerifyEmailResponse {
  userId: User['userId'];
}

export interface ForgotPasswordResponse {
  userId: User['userId'];
}

export interface ResetPasswordResponse {
  userId: User['userId'];
}
