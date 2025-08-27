import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { User } from '../../drizzle/schema';

export class CreateUserRequest {
  @IsString()
  name: User['name'];

  @IsString()
  email: User['email'];

  @IsString()
  password: User['password'];

  @IsNumber()
  roleId: User['roleId'];

  @IsString()
  @IsOptional()
  userNumber?: User['userNumber'];

  @IsBoolean()
  @IsOptional()
  isVerified?: User['isVerified'];

  @IsString()
  @IsOptional()
  verificationToken?: User['verificationToken'];
}

export class GetUserByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  userId: User['userId'];
}

export class GetUserByEmailRequest {
  @IsString()
  email: User['email'];
}

export class UpdateUserRequest {
  @IsNumber()
  userId: User['userId'];

  @IsString()
  @IsOptional()
  name?: User['name'];

  @IsString()
  @IsOptional()
  email?: User['email'];

  @IsString()
  @IsOptional()
  password?: User['password'];

  @IsString()
  @IsOptional()
  userNumber?: User['userNumber'];

  @IsString()
  @IsOptional()
  image?: User['image'];

  @IsNumber()
  @IsOptional()
  roleId?: User['roleId'];

  @IsBoolean()
  @IsOptional()
  isVerified?: User['isVerified'];

  @IsString()
  @IsOptional()
  verificationToken?: User['verificationToken'];

  @IsString()
  @IsOptional()
  resetPasswordToken?: User['resetPasswordToken'];
}

export class UpdateProfileRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  userId: User['userId'];

  @IsString()
  @IsOptional()
  name?: User['name'];

  @IsString()
  @IsOptional()
  userNumber?: User['userNumber'];

  @IsString()
  @IsOptional()
  image?: User['image'];
}
