import { UserProtected } from 'src/user/user.interface';
import {
  AssessmentPeriod,
  Assignment,
  Criterion,
  Group,
  Question,
  User,
} from '../../drizzle/schema';

export interface GetAssignmentByIdResponse extends Assignment {
  isEnded: boolean;
}

interface GroupWithMarkingStatus extends Group {
  isMarked: boolean;
}

export interface GetGroupsByAssignmentIdResponse
  extends Array<GroupWithMarkingStatus> {}

export interface GetCriteriaByAssignmentIdResponse extends Array<Criterion> {}

interface PeriodWithQuestions extends AssessmentPeriod {
  questions: Question[];
}

export interface GetAssessmentPeriodsByAssignmentIdResponse
  extends Array<PeriodWithQuestions> {}

export interface GetMarkingProgressByAssignmentIdResponse {
  markingProgress: number;
}

export interface CreateAssignmentResponse extends Assignment {}

export interface UpdateAssignmentResponse extends Assignment {}

export interface DeleteAssignmentResponse {
  assignmentId: Assignment['assignmentId'];
}

interface GroupWithMembers extends Group {
  members: UserProtected[];
}

export type GetJoinedGroupResponse = GroupWithMembers | null;
