import { AssessmentPeriod, Question } from '../../drizzle/schema';

export interface GetAssessmentPeriodByIdResponse extends AssessmentPeriod {
  questions: Question[];
}

export interface CreateAssessmentPeriodResponse extends AssessmentPeriod {}

export interface UpdateAssessmentPeriodResponse extends AssessmentPeriod {}

export interface DeleteAssessmentPeriodResponse {
  assessmentPeriodId: AssessmentPeriod['assessmentPeriodId'];
}

export interface CreateAssessmentQuestionResponse extends Question {}

export interface UpdateAssessmentQuestionResponse extends Question {}

export interface DeleteAssessmentQuestionResponse {
  questionId: Question['questionId'];
}
