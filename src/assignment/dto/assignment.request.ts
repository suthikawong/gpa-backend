import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsString,
} from 'class-validator';
import { Assignment } from '../../drizzle/schema';

export class GetAssignmentByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assignmentId: Assignment['assignmentId'];
}

export class CreateAssignmentRequest {
  @IsString()
  assignmentName: Assignment['assignmentName'];

  @IsInt()
  modelConfigurationId: Assignment['modelConfigurationId'];

  @IsBoolean()
  isPublished: Assignment['isPublished'];

  @IsDateString()
  dueDate: string;

  @IsInt()
  classroomId: Assignment['classroomId'];
}

export class UpdateAssignmentRequest {
  @IsInt()
  assignmentId: Assignment['assignmentId'];

  @IsString()
  assignmentName: Assignment['assignmentName'];

  @IsInt()
  modelConfigurationId: Assignment['modelConfigurationId'];

  @IsBoolean()
  isPublished: Assignment['isPublished'];

  @IsDateString()
  dueDate: string;

  @IsInt()
  classroomId: Assignment['classroomId'];
}

export class DeleteAssignmentRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assignmentId: Assignment['assignmentId'];
}
