import { UserProtected } from '../../user/user.interface';
import {
  Assessment,
  AssessmentStudent,
  Group,
  ScoringComponent,
  StudentScore,
} from '../../drizzle/schema';

export interface AssessmentWithInstructor extends Assessment {
  instructor: UserProtected;
}

export interface GetAssessmentByIdResponse extends AssessmentWithInstructor {}

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

export interface StudentWithIsConfirmed extends UserProtected {
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
> | null;

export type RemoveStudentFromAssessmentResponse = Pick<
  AssessmentStudent,
  'studentUserId'
>;

export interface GetScoringComponentsByAssessmentIdResponse
  extends Array<ScoringComponent> {}

export interface GroupWithGroupMembers extends Group {
  members: Array<UserProtected>;
}

export type GetStudentJoinedGroupResponse = GroupWithGroupMembers | null;

export interface GetGroupsByAssessmentIdResponse extends Array<Group> {}

export type GetMyScoreResponse = Pick<
  StudentScore,
  'studentUserId' | 'score'
> | null;

export type CheckScoringComponentActiveResponse = Pick<
  ScoringComponent,
  'scoringComponentId'
> | null;
