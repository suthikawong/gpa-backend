import {
  AssessmentPeriod,
  Assignment,
  Criterion,
  Group,
  Question,
} from '../../drizzle/schema';

export interface GetAssignmentByIdResponse extends Assignment {
  isEnded: boolean;
}

export interface GetGroupsByAssignmentIdResponse extends Array<Group> {}

export interface GetCriteriaByAssignmentIdResponse extends Array<Criterion> {}

interface TempPeriod extends AssessmentPeriod {
  questions: Question[];
}

export interface GetAssessmentPeriodsByAssignmentIdResponse
  extends Array<TempPeriod> {}

export interface GetMarkingProgressByAssignmentIdResponse {
  markingProgress: number;
}

export interface CreateAssignmentResponse extends Assignment {}

export interface UpdateAssignmentResponse extends Assignment {}

export interface DeleteAssignmentResponse {
  assignmentId: Assignment['assignmentId'];
}
