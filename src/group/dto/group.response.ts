import { UserProtected } from 'src/user/user.interface';
import { Group, User } from '../../drizzle/schema';

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
