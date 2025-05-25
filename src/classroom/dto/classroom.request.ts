import { Transform } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Classroom, User } from 'src/drizzle/schema';

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

export class GetClassroomsByInstructorRequest {
  @Transform(({ value }) => {
    console.log(value);
    return parseInt(value);
  })
  @IsNumber()
  instructorUserId: Classroom['instructorUserId'];
}

export class GetClassroomsByStudentRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  studentUserId: User['userId'];
}

export class GetStudentsInClassroomRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  classroomId: Classroom['classroomId'];
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
