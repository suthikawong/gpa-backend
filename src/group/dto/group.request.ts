import { Transform } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';
import { Assignment, Group, User } from '../../drizzle/schema';

export class GetGroupByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];
}

export class CreateGroupRequest {
  @IsString()
  groupName: Group['groupName'];

  @IsInt()
  assignmentId: Group['assignmentId'];
}

export class UpdateGroupRequest {
  @IsInt()
  groupId: Group['groupId'];

  @IsString()
  groupName: Group['groupName'];
}

export class DeleteGroupRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];
}

export class JoinGroupRequest {
  @IsString()
  groupCode: Group['groupCode'];
}

export class LeaveGroupRequest {
  @IsInt()
  groupId: Group['groupId'];
}

export class GetGroupMembersRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];
}

export class AddGroupMemberRequest {
  @IsInt()
  groupId: Group['groupId'];

  @IsInt()
  studentUserId: User['userId'];
}

export class DeleteGroupMemberRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  groupId: Group['groupId'];

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  studentUserId: User['userId'];
}
