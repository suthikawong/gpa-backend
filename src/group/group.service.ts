import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssignmentService } from 'src/assignment/assignment.service';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { generateCode } from 'src/utils/generate-code';
import * as schema from '../drizzle/schema';
import {
  AddGroupMemberRequest,
  CreateGroupRequest,
  DeleteGroupMemberRequest,
  UpdateGroupRequest,
} from './dto/group.request';
import {
  AddGroupMemberResponse,
  CreateGroupResponse,
  DeleteGroupMemberResponse,
  DeleteGroupResponse,
  GetGroupByIdResponse,
  GetGroupMembersResponse,
  JoinGroupResponse,
  LeaveGroupResponse,
  UpdateGroupResponse,
} from './dto/group.response';

interface ValidateGroupInterface {
  groupId?: schema.Group['groupId'];
  groupName: schema.Group['groupName'];
  assignmentId?: schema.Group['assignmentId'];
}

@Injectable()
export class GroupService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly assignmentService: AssignmentService,
  ) {}

  async getGroupById(
    groupId: schema.Group['groupId'],
  ): Promise<GetGroupByIdResponse> {
    const group = await this.db.query.groups.findFirst({
      where: eq(schema.groups.groupId, groupId),
    });

    if (!group) {
      throw new NotFoundException(`Group not found`);
    }
    return group;
  }

  async create(data: CreateGroupRequest): Promise<CreateGroupResponse> {
    await this.validateGroup(data);
    const groupCode = await this.generateUniqueCode();

    const [group] = await this.db
      .insert(schema.groups)
      .values({
        groupName: data.groupName,
        groupCode: groupCode,
        assignmentId: data.assignmentId,
      })
      .returning();

    return group;
  }

  async update(data: UpdateGroupRequest): Promise<UpdateGroupResponse> {
    const { groupId, ...updatedData } = data;
    await this.validateGroup(data);

    const [group] = await this.db
      .update(schema.groups)
      .set(updatedData)
      .where(eq(schema.groups.groupId, data.groupId))
      .returning();

    return group;
  }

  async delete(groupId: schema.Group['groupId']): Promise<DeleteGroupResponse> {
    await this.getGroupById(groupId);

    await this.db
      .delete(schema.groups)
      .where(eq(schema.groups.groupId, groupId));

    return { groupId };
  }

  async joinGroup(
    groupCode: schema.Group['groupCode'],
    studentUserId: schema.User['userId'],
  ): Promise<JoinGroupResponse> {
    const group = await this.db.query.groups.findFirst({
      where: eq(schema.groups.groupCode, groupCode),
    });
    if (!group) {
      throw new BadRequestException('Group not found.');
    }

    const existing = await this.db.query.groupMembers.findFirst({
      where: (gm) =>
        eq(gm.groupId, group.groupId) && eq(gm.studentUserId, studentUserId),
    });
    if (existing) {
      throw new BadRequestException('You already joined this group.');
    }

    await this.db.insert(schema.groupMembers).values({
      groupId: group.groupId,
      studentUserId,
    });

    return { group };
  }

  async leaveGroup(
    groupId: schema.Group['groupId'],
    studentUserId: schema.User['userId'],
  ): Promise<LeaveGroupResponse> {
    await this.getGroupById(groupId);
    await this.db
      .delete(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.groupMembers.studentUserId, studentUserId),
        ),
      );

    return { groupId };
  }

  async getGroupMembersById(
    groupId: schema.Group['groupId'],
  ): Promise<GetGroupMembersResponse> {
    await this.getGroupById(groupId);
    const members = await this.db
      .select({
        userId: schema.users.userId,
        name: schema.users.name,
        email: schema.users.email,
        roleId: schema.users.roleId,
      })
      .from(schema.groupMembers)
      .innerJoin(
        schema.users,
        eq(schema.groupMembers.studentUserId, schema.users.userId),
      )
      .where(eq(schema.groupMembers.groupId, groupId));

    return members;
  }

  async addGroupMember(
    data: AddGroupMemberRequest,
  ): Promise<AddGroupMemberResponse> {
    await this.getGroupById(data.groupId);
    await this.db.insert(schema.groupMembers).values(data);
    return { studentUserId: data.studentUserId };
  }

  async deleteGroupMember(
    data: DeleteGroupMemberRequest,
  ): Promise<DeleteGroupMemberResponse> {
    await this.getGroupById(data.groupId);
    await this.db
      .delete(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, data.groupId),
          eq(schema.groupMembers.studentUserId, data.studentUserId),
        ),
      );
    return { studentUserId: data.studentUserId };
  }

  async validateGroup(data: ValidateGroupInterface) {
    let assignmentId: schema.Group['assignmentId'];
    if (data?.groupId) {
      const group = await this.getGroupById(data.groupId);
      assignmentId = group.assignmentId;
    } else {
      assignmentId = data.assignmentId!;
    }
    await this.assignmentService.getAssignmentById(assignmentId);
    await this.validateGroupName(assignmentId, data.groupName, data?.groupId);
  }

  async validateGroupName(
    assignmentId: schema.Assignment['assignmentId'],
    groupName: schema.Group['groupName'],
    excludeGroupId?: schema.Group['groupId'],
  ) {
    const conditions = [
      eq(schema.groups.groupName, groupName),
      eq(schema.groups.assignmentId, assignmentId),
    ];

    if (excludeGroupId) {
      conditions.push(ne(schema.groups.groupId, excludeGroupId));
    }

    const [existing] = await this.db
      .select()
      .from(schema.groups)
      .where(and(...conditions));

    if (existing) {
      throw new BadRequestException('Group name already exists.');
    }
  }

  async generateUniqueCode(length = 8): Promise<string> {
    const maxRetries = 5;

    for (let i = 0; i < maxRetries; i++) {
      const code = generateCode(length);

      const group = await this.db.query.groups.findFirst({
        where: eq(schema.groups.groupCode, code),
      });

      if (!group) {
        return code;
      }
    }

    throw new Error(
      'Failed to generate a unique group code. Please try again.',
    );
  }
}
