import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { User } from 'src/drizzle/schema';

export class CreateUserRequest {
  @IsString()
  name: User['name'];

  @IsString()
  email: User['email'];

  @IsString()
  password: User['password'];

  @IsNumber()
  roleId: User['roleId'];
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
  name: User['name'];

  @IsString()
  @IsOptional()
  email?: User['email'];

  @IsString()
  @IsOptional()
  password?: User['password'];

  @IsNumber()
  @IsOptional()
  roleId: User['roleId'];
}
