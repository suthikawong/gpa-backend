import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  Assessment,
  Group,
  GroupScore,
  StudentScore,
  User,
} from '../../drizzle/schema';
import { QASSMode } from '../../utils/qass.model';

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

export class CreateRandomGroupsRequest {
  @IsNumber()
  assessmentId: Group['assessmentId'];

  @IsNumber()
  groupSize: number;
}

export class ImportGroupsRequest {
  @Type(() => Number)
  @IsNumber()
  assessmentId: Assessment['assessmentId'];
}

export class VerifyImportGroupsRequest extends ImportGroupsRequest {}

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

export class DeleteAllGroupMembersRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];
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
  score?: StudentScore['score'];

  @IsOptional()
  @IsString()
  remark?: StudentScore['remark'];
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

export class WeightItem {
  @IsNumber()
  userId: User['userId'];

  @IsNumber()
  weight: number;
}

export class CalculateScoreByQassRequest {
  @IsNumber()
  groupId: GroupScore['groupId'];

  @IsEnum(QASSMode)
  mode: QASSMode;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  polishingFactor: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  peerRatingImpact: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  groupSpread: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  groupScore: GroupScore['score'];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeightItem)
  weights: WeightItem[];

  @IsBoolean()
  isTotalScoreConstrained: boolean;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  scoreConstraint: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  lowerBound: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  upperBound: number;
}

export class CalculateScoreByWebavaliaRequest {
  @IsNumber()
  groupId: GroupScore['groupId'];

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  groupGrade: GroupScore['score'];

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  selfWeight: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  peerWeight: number;
}
