import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Group, GroupScore, StudentScore, User } from '../../drizzle/schema';

export class GetGroupByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  groupId: Group['groupId'];
}

export class CreateGroupRequest {
  @IsString()
  groupName: Group['groupName'];

  @IsNumber()
  assessmentId: Group['assessmentId'];
}

export class UpdateGroupRequest {
  @IsNumber()
  groupId: Group['groupId'];

  @IsString()
  groupName: Group['groupName'];
}

export class DeleteGroupRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  groupId: Group['groupId'];
}

export class JoinGroupRequest {
  @IsString()
  groupCode: Group['groupCode'];
}

export class LeaveGroupRequest {
  @IsInt()
  groupId: Group['groupId'];
}

export class GetGroupMembersRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];
}

export class AddGroupMemberRequest {
  @IsInt()
  groupId: Group['groupId'];

  @IsInt()
  studentUserId: User['userId'];
}

export class DeleteGroupMemberRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  studentUserId: User['userId'];
}

export class GetScoresRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  groupId: Group['groupId'];
}

export class StudentScoreItem {
  @IsNumber()
  studentUserId: StudentScore['studentScoreId'];

  @IsOptional()
  @IsNumber()
  score: StudentScore['score'];

  @IsOptional()
  @IsString()
  remark: StudentScore['remark'];
}

export class UpsertScoresRequest {
  @IsNumber()
  groupId: GroupScore['groupId'];

  @IsOptional()
  @IsNumber()
  groupScore: GroupScore['score'];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentScoreItem)
  studentScores: StudentScoreItem[];
}

export class CalculateScoresRequest {
  @IsNumber()
  groupId: GroupScore['groupId'];
}
