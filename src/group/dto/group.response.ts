import {
  Group,
  GroupScore,
  ScoringComponent,
  StudentScore,
  User,
} from '../../drizzle/schema';
import { UserProtected } from '../../user/user.interface';

export interface GetGroupByIdResponse extends Group {
  memberCount: number;
}

export interface CreateGroupResponse extends Group {}

export interface CreateRandomGroupsResponse {
  success: boolean;
}

export interface ImportGroupsResponse {
  success: boolean;
  errors: {
    row: number;
    message: string;
  }[];
}

export interface VerifyImportGroupsResponse {
  groupsMap: Map<string, number[]>;
  errors: {
    row: number;
    message: string;
  }[];
}

export interface UpdateGroupResponse extends Group {}

export type DeleteGroupResponse = Pick<Group, 'groupId'>;

export interface JoinGroupResponse {
  group: Group;
}

export type LeaveGroupResponse = Pick<Group, 'groupId'>;

export interface GetGroupMembersResponse extends Array<UserProtected> {}

export interface AddGroupMemberResponse {
  studentUserId: User['userId'];
}

export interface DeleteGroupMemberResponse {
  studentUserId: User['userId'];
}

export interface DeleteAllGroupMembersResponse {
  groupId: Group['groupId'];
}

export interface StudentScoreItem extends UserProtected {
  studentScore: StudentScore;
}

export interface GetScoresResponse {
  groupScore: GroupScore | null;
  studentScores: Array<StudentScoreItem>;
}

export type UpsertScoresResponse = Pick<Group, 'groupId'>;

export type CalculateScoreByQassResponse = Pick<Group, 'groupId'>;

export type CalculateScoreByWebavaliaResponse = Pick<Group, 'groupId'>;

export interface ScoringComponentWithStudents
  extends Pick<
    ScoringComponent,
    'scoringComponentId' | 'startDate' | 'endDate'
  > {
  noRatingStudents: Array<UserProtected>;
}

export type GetStudentsWithoutPeerAssessmentResponse =
  Array<ScoringComponentWithStudents>;
