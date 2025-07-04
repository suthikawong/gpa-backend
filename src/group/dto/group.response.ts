import { Group, User } from '../../drizzle/schema';
import { UserProtected } from '../../user/user.interface';

export interface GetGroupByIdResponse extends Group {}

export interface CreateGroupResponse extends Group {}

export interface UpdateGroupResponse extends Group {}

export interface DeleteGroupResponse {
  groupId: Group['groupId'];
}

export interface JoinGroupResponse {
  group: Group;
}

export interface LeaveGroupResponse {
  groupId: Group['groupId'];
}

export interface GetGroupMembersResponse extends Array<UserProtected> {}

export interface AddGroupMemberResponse {
  studentUserId: User['userId'];
}

export interface DeleteGroupMemberResponse {
  studentUserId: User['userId'];
}

export interface UserWithAssessmentStatus extends UserProtected {
  assessmentStatus: boolean;
}

export type GetAssessmentStatusByGroupIdResponse =
  Array<UserWithAssessmentStatus>;
