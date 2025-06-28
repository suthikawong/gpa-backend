import { Assessment } from '../../drizzle/schema';

export interface GetAssessmentByIdResponse
  extends Omit<Assessment, 'modelId' | 'modelConfig'> {}

export type GetAssessmentsByInstructorResponse = Omit<
  Assessment,
  'modelId' | 'modelConfig'
>[];

export type GetAssessmentsByStudentResponse = Omit<
  Assessment,
  'modelId' | 'modelConfig'
>[];

export interface CreateAssessmentResponse extends Assessment {}

export interface UpdateAssessmentResponse extends Assessment {}

export type DeleteAssessmentResponse = Pick<Assessment, 'assessmentId'>;
