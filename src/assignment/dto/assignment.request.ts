import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  Assignment,
  Group,
  GroupMark,
  StudentMark,
  User,
} from '../../drizzle/schema';

export class GetAssignmentByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  assignmentId: Assignment['assignmentId'];
}

export class GetGroupsByAssignmentIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  assignmentId: Assignment['assignmentId'];
}

export class GetCriteriaByAssignmentIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  assignmentId: Assignment['assignmentId'];
}

export class GetAssessmentPeriodsByAssignmentIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assignmentId: Assignment['assignmentId'];
}

export class GetMarkingProgressByAssignmentIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  assignmentId: Assignment['assignmentId'];
}

export class CreateAssignmentRequest {
  @IsString()
  assignmentName: Assignment['assignmentName'];

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
  @IsInt()
  assignmentId: Assignment['assignmentId'];
}

export class GetJoinedGroupRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  assignmentId: Assignment['assignmentId'];
}

class GroupMarkItem {
  @IsInt()
  criterionId: GroupMark['criterionId'];

  @IsInt()
  @Min(0)
  mark: GroupMark['groupId'];
}

export class GetGroupMarkByGroupIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];
}

export class MarkGroupRequest {
  @IsInt()
  groupId: GroupMark['groupId'];

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => GroupMarkItem)
  marks: GroupMarkItem[];
}

export class GetStudentMarksByGroupIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];
}

class StudentMarkItem {
  @IsNumber()
  studentUserId: User['userId'];

  @IsNumber()
  mark: StudentMark['mark'];
}

export class UpsertStudentMarksRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  assignmentId: Assignment['assignmentId'];

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => StudentMarkItem)
  marks: StudentMarkItem[];
}

export class ExportAssignmentScoresRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  assignmentId: Assignment['assignmentId'];
}

export class GetMyMarkRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  assignmentId: Assignment['assignmentId'];
}
