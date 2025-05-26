import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsString } from 'class-validator';
import { AssessmentPeriod, Question } from '../../drizzle/schema';

export class GetAssessmentPeriodByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  assessmentPeriodId: AssessmentPeriod['assessmentPeriodId'];
}

export class CreateAssessmentPeriodRequest {
  @IsDateString()
  assessStartDate: AssessmentPeriod['assessStartDate'];

  @IsDateString()
  assessEndDate: AssessmentPeriod['assessEndDate'];

  @IsNumber()
  weight: AssessmentPeriod['weight'];

  @IsInt()
  assignmentId: AssessmentPeriod['assignmentId'];
}

export class UpdateAssessmentPeriodRequest {
  @IsInt()
  assessmentPeriodId: AssessmentPeriod['assessmentPeriodId'];

  @IsDateString()
  assessStartDate: AssessmentPeriod['assessStartDate'];

  @IsDateString()
  assessEndDate: AssessmentPeriod['assessEndDate'];

  @IsNumber()
  weight: AssessmentPeriod['weight'];
}

export class DeleteAssessmentPeriodRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  assessmentPeriodId: AssessmentPeriod['assessmentPeriodId'];
}

export class CreateAssessmentQuestionRequest {
  @IsInt()
  assessmentPeriodId: Question['assessmentPeriodId'];

  @IsString()
  question: Question['question'];

  @IsInt()
  displayOrder: Question['displayOrder'];
}

export class UpdateAssessmentQuestionRequest {
  @IsInt()
  questionId: Question['questionId'];

  @IsString()
  question: Question['question'];

  @IsInt()
  displayOrder: Question['displayOrder'];
}

export class DeleteAssessmentQuestionRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  questionId: Question['questionId'];
}
