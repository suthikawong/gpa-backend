import {
  AssessmentPeriod,
  Assignment,
  Criterion,
  Group,
  Model,
  ModelConfiguration,
} from '../../drizzle/schema';

export interface GetAssignmentByIdResponse extends Assignment {
  model: Model | null;
  modelConfiguration: ModelConfiguration | null;
  groups: Group[];
  criteria: Criterion[];
  assessmentPeriods: AssessmentPeriod[];
  isEnded: boolean;
  markingProgress: number;
}

export interface CreateAssignmentResponse extends Assignment {}

export interface UpdateAssignmentResponse extends Assignment {}

export interface DeleteAssignmentResponse {
  assignmentId: Assignment['assignmentId'];
}
