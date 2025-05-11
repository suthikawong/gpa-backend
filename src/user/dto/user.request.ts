import { IsString } from 'class-validator';

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
  email: string;

  @IsString()
  password: string;
}
