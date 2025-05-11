import { IsOptional, IsString } from 'class-validator';

export class CreateUserRequest {
  @IsString()
  email: string;

  @IsString()
  password: string;
}

export class GetUserByIdRequest {
  @IsString()
  id: string;
}

export class UpdateUserRequest {
  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
