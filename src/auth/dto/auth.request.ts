import { IsNumber, IsString, MinLength } from 'class-validator';
import { User } from '../../drizzle/schema';
import { Optional } from '@nestjs/common';

export class RegisterRequest {
  @IsString()
  name: User['name'];

  @IsString()
  email: User['email'];

  @IsString()
  @MinLength(8)
  password: User['password'];

  @Optional()
  @IsString()
  userNumber?: User['userNumber'];

  @IsNumber()
  roleId: User['roleId'];
}

export class VerifyEmailRequest {
  @IsString()
  token: User['verificationToken'];
}

export class ForgotPasswordRequest {
  @IsString()
  email: User['email'];
}

export class ResetPasswordRequest {
  @IsString()
  token: User['resetPasswordToken'];

  @IsString()
  password: User['password'];
}
