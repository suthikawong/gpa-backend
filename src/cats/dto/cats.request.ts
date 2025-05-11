import { IsInt, IsString } from 'class-validator';

export class CreateCatRequest {
  @IsString()
  name: string;

  @IsInt()
  age: number;

  @IsString()
  breed: string;
}
