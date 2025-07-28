import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import {
  Assessment,
  AssessmentStudent,
  Group,
  ScoringComponent,
} from '../../drizzle/schema';

export class GetAssessmentByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assessmentId: Assessment['assessmentId'];
}

export class CreateAssessmentRequest {
  @IsString()
  assessmentName: Assessment['assessmentName'];
}

export class UpdateAssessmentRequest {
  @IsNumber()
  assessmentId: Assessment['assessmentId'];

  @IsString()
  assessmentName: Assessment['assessmentName'];

  @IsOptional()
  @IsNumber()
  modelId?: Assessment['modelId'];

  @IsOptional()
  modelConfig?: Assessment['modelConfig'];

  @IsBoolean()
  isPublished: Assessment['isPublished'];
}

export class DeleteAssessmentRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assessmentId: Assessment['assessmentId'];
}

export class SearchStudentsInAssessmentRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assessmentId: AssessmentStudent['assessmentId'];

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  offset?: number;
}

export class StudentJoinAssessmentRequest {
  @IsString()
  assessmentCode: Assessment['assessmentCode'];
}

export class ConfirmStudentJoinAssessmentRequest {
  @IsNumber()
  assessmentId: AssessmentStudent['assessmentId'];

  @IsNumber()
  studentUserId: AssessmentStudent['studentUserId'];

  @IsBoolean()
  isConfirmed: AssessmentStudent['isConfirmed'];
}

export class RemoveStudentFromAssessmentRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assessmentId: AssessmentStudent['assessmentId'];

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  studentUserId: AssessmentStudent['studentUserId'];
}

export class GetScoringComponentsByAssessmentIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assessmentId: ScoringComponent['assessmentId'];
}

export class GetStudentJoinedGroupRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assessmentId: Group['assessmentId'];
}

export class GetGroupsByAssessmentIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assessmentId: Group['assessmentId'];
}

export class GetMyScoreRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assessmentId: Assessment['assessmentId'];
}

export class CheckScoringComponentActiveRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assessmentId: Assessment['assessmentId'];
}

export class ExportAssessmentScoresRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assessmentId: Assessment['assessmentId'];
}
