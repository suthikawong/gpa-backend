import { Group } from '../../drizzle/schema';

export interface GetGroupByIdResponse extends Group {}

export interface CreateGroupResponse extends Group {}

export interface UpdateGroupResponse extends Group {}

export type DeleteGroupResponse = Pick<Group, 'groupId'>;
