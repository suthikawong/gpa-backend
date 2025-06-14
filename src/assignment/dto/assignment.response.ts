import {
  AssessmentPeriod,
  Assignment,
  Criterion,
  Group,
  GroupMark,
  Question,
  StudentMark,
} from '../../drizzle/schema';
import { UserProtected } from '../../user/user.interface';

export interface GetAssignmentByIdResponse extends Assignment {
  isEnded: boolean;
}

export interface GroupWithMarkingStatus extends Group {
  isMarked: boolean;
}

export interface GetGroupsByAssignmentIdResponse
  extends Array<GroupWithMarkingStatus> {}

export interface GetCriteriaByAssignmentIdResponse extends Array<Criterion> {}

export interface PeriodWithQuestions extends AssessmentPeriod {
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

export interface GroupWithMembers extends Group {
  members: UserProtected[];
}

export type GetJoinedGroupResponse = GroupWithMembers | null;

export interface CriterionWithGroupMark extends Criterion {
  mark: GroupMark;
}

export interface GetGroupMarkByGroupIdResponse
  extends Array<CriterionWithGroupMark> {}

export interface MarkGroupResponse {
  groupId: Group['groupId'];
}

export interface UserWithStudentMark extends UserProtected {
  mark: StudentMark | null;
}

export interface GetStudentMarksByGroupIdResponse
  extends Array<UserWithStudentMark> {}

export interface UpsertStudentMarksResponse {
  assignmentId: Assignment['assignmentId'];
}

export interface GetMyMarkResponse {
  mark: number | null;
}
