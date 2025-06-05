import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssignmentService } from '../assignment/assignment.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { UserService } from '../user/user.service';
import { generateCode } from '../utils/generate-code';
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
  GetAssessmentStatusByGroupIdResponse,
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
    private readonly userService: UserService,
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

  async create(
    data: CreateGroupRequest,
    userId: schema.User['userId'],
  ): Promise<CreateGroupResponse> {
    await this.validateGroup(data);
    const groupCode = await this.generateUniqueCode();

    const [group] = await this.db
      .insert(schema.groups)
      .values({
        groupName: data.groupName,
        groupCode: groupCode,
        assignmentId: data.assignmentId,
        createdBy: userId,
        createdDate: new Date(),
      })
      .returning();

    return group;
  }

  async update(
    data: UpdateGroupRequest,
    userId: schema.User['userId'],
  ): Promise<UpdateGroupResponse> {
    const { groupId, ...updatedData } = data;
    await this.validateGroup(data);

    const [group] = await this.db
      .update(schema.groups)
      .set({ ...updatedData, updatedBy: userId, updatedDate: new Date() })
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
    await this.userService.getUserById(data.studentUserId);

    await this.db.transaction(async (tx) => {
      await tx.execute(sql`
        DELETE FROM student_marks
        USING groups
        WHERE groups.assignment_id = student_marks.assignment_id
          AND student_marks.student_user_id = ${data.studentUserId}
          AND groups.group_id = ${data.groupId}
      `);

      await tx.execute(sql`
        DELETE FROM peer_assessments
        USING groups
        WHERE groups.assignment_id = peer_assessments.assignment_id
          AND groups.group_id = ${data.groupId}
          AND (
            peer_assessments.assessed_student_user_id = ${data.studentUserId}
            OR peer_assessments.assessor_student_user_id = ${data.studentUserId}
          )
      `);

      await tx
        .delete(schema.groupMembers)
        .where(
          and(
            eq(schema.groupMembers.groupId, data.groupId),
            eq(schema.groupMembers.studentUserId, data.studentUserId),
          ),
        );
    });

    return { studentUserId: data.studentUserId };
  }

  async getAssessmentStatusByGroupId(
    groupId: schema.Group['groupId'],
    userId: schema.User['userId'],
  ): Promise<GetAssessmentStatusByGroupIdResponse> {
    const group = await this.getGroupById(groupId);

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
      .where(eq(schema.groupMembers.groupId, groupId))
      .orderBy(schema.users.userId);

    const targetUserIds = members.map((user) => user.userId);

    const assessed = await this.db
      .select({
        assessedUserId: schema.peerAssessments.assessedStudentUserId,
      })
      .from(schema.peerAssessments)
      .where(
        and(
          eq(schema.peerAssessments.assessorStudentUserId, userId),
          inArray(schema.peerAssessments.assessedStudentUserId, targetUserIds),
          eq(schema.peerAssessments.assignmentId, group.assignmentId),
        ),
      );

    const assessedSet = new Set(assessed.map((item) => item.assessedUserId));

    return members.map((user) => ({
      ...user,
      assessmentStatus: assessedSet.has(user.userId),
    }));
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
