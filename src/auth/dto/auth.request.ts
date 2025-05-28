import { IsNumber, IsString, MinLength } from 'class-validator';
import { User } from '../../drizzle/schema';

export class RegisterRequest {
  @IsString()
  name: User['name'];

  @IsString()
  email: User['email'];

  @IsString()
  @MinLength(8)
  password: User['password'];

  @IsNumber()
  roleId: User['roleId'];
}
