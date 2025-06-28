import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Assessment } from '../../drizzle/schema';

export class GetAssessmentByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  assessmentId: Assessment['assessmentId'];
}

export class GetAssessmentsByInstructorRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  instructorUserId: number;
}

export class GetAssessmentsByStudentRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  studentUserId: number;
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
