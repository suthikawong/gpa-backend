import {
  Assessment,
  AssessmentStudent,
  ScoringComponent,
  User,
} from '../../drizzle/schema';

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

export interface StudentWithIsConfirmed
  extends Pick<User, 'userId' | 'name' | 'email'> {
  isConfirmed: AssessmentStudent['isConfirmed'];
}

export interface SearchStudentsInAssessmentResponse
  extends Array<StudentWithIsConfirmed> {}

export type StudentJoinAssessmentResponse = Pick<
  AssessmentStudent,
  'studentUserId'
>;

export type ConfirmStudentJoinAssessmentResponse = Pick<
  AssessmentStudent,
  'studentUserId'
>;

export type RemoveStudentFromAssessmentResponse = Pick<
  AssessmentStudent,
  'studentUserId'
>;

export interface GetScoringComponentsByAssessmentIdResponse
  extends Array<ScoringComponent> {}
