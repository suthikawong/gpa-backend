import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Classroom, User } from '../../drizzle/schema';

export class CreateClassroomRequest {
  @IsString()
  classroomName: Classroom['classroomName'];

  @IsInt()
  instituteId: Classroom['instituteId'];
}

export class UpdateClassroomRequest {
  @IsInt()
  classroomId: Classroom['classroomId'];

  @IsString()
  classroomName: Classroom['classroomName'];

  @IsBoolean()
  isActive: Classroom['isActive'];

  @IsInt()
  instituteId: Classroom['instituteId'];
}

export class GetClassroomByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  classroomId: Classroom['classroomId'];
}

export class DeleteClassroomRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  classroomId: Classroom['classroomId'];
}

export class SearchStudentsInClassroomRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  classroomId: Classroom['classroomId'];

  @IsOptional()
  @IsString()
  name?: User['name'];

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  offset?: number;
}

export class RemoveStudentFromClassroomRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  classroomId: Classroom['classroomId'];

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  studentUserId: User['userId'];
}

export class GetAssignmentsByClassroomIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  classroomId: Classroom['classroomId'];
}

export class JoinClassroomRequest {
  @IsString()
  classroomCode: Classroom['classroomCode'];
}
