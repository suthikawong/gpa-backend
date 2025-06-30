import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Role } from '../app.config';
import { AssessmentService } from '../assessment/assessment.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { Group, User } from '../drizzle/schema';
import { UserService } from '../user/user.service';
import { generateCode } from '../utils/generate-code';
import {
  AddGroupMemberRequest,
  CreateGroupRequest,
  DeleteGroupMemberRequest,
  UpdateGroupRequest,
  UpsertScoresRequest,
} from './dto/group.request';
import {
  AddGroupMemberResponse,
  CreateGroupResponse,
  DeleteGroupMemberResponse,
  DeleteGroupResponse,
  GetGroupByIdResponse,
  GetGroupMembersResponse,
  GetScoresResponse,
  JoinGroupResponse,
  LeaveGroupResponse,
  UpdateGroupResponse,
  UpsertScoresResponse,
} from './dto/group.response';

@Injectable()
export class GroupService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,

    private readonly assessmentService: AssessmentService,
    private readonly userService: UserService,
  ) {}

  async getGroupById(
    groupId: schema.Group['groupId'],
  ): Promise<GetGroupByIdResponse> {
    const group = await this.db.query.groups.findFirst({
      where: eq(schema.groups.groupId, groupId),
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async createGroup(
    data: CreateGroupRequest,
    createdBy: schema.User['userId'],
    roleId: User['roleId'],
  ): Promise<CreateGroupResponse> {
    await this.assessmentService.getAssessmentById(data.assessmentId);
    await this.checkUserRole(data.assessmentId, roleId);

    const groupCode = await this.generateUniqueCode();

    const [group] = await this.db
      .insert(schema.groups)
      .values({ ...data, groupCode, createdBy, createdDate: new Date() })
      .returning();

    return group;
  }

  async updateGroup(
    data: UpdateGroupRequest,
    updatedBy: schema.User['userId'],
  ): Promise<UpdateGroupResponse> {
    const existing = await this.db.query.groups.findFirst({
      where: eq(schema.groups.groupId, data.groupId),
    });

    if (!existing) throw new NotFoundException('Group not found');

    const [group] = await this.db
      .update(schema.groups)
      .set({ ...data, updatedBy, updatedDate: new Date() })
      .where(eq(schema.groups.groupId, data.groupId))
      .returning();

    return group;
  }

  async deleteGroup(
    groupId: Group['groupId'],
    roleId: User['roleId'],
  ): Promise<DeleteGroupResponse> {
    const group = await this.db.query.groups.findFirst({
      where: eq(schema.groups.groupId, groupId),
    });

    if (!group) throw new NotFoundException('Group not found');

    await this.checkUserRole(group.assessmentId, roleId);

    await this.db
      .delete(schema.groups)
      .where(eq(schema.groups.groupId, groupId));

    return { groupId: group.groupId };
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
      where: and(
        eq(schema.groupMembers.groupId, group.groupId),
        eq(schema.groupMembers.studentUserId, studentUserId),
      ),
    });
    if (existing) {
      throw new BadRequestException('You already joined this group.');
    }

    await this.checkScoringComponentStarted(group.assessmentId);

    await this.db.insert(schema.groupMembers).values({
      groupId: group.groupId,
      studentUserId,
      createdDate: new Date(),
    });

    return { group };
  }

  async leaveGroup(
    groupId: schema.Group['groupId'],
    studentUserId: schema.User['userId'],
  ): Promise<LeaveGroupResponse> {
    const group = await this.getGroupById(groupId);
    await this.checkScoringComponentStarted(group.assessmentId);

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

  async getMembersByGroupId(
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
    await this.userService.getUserById(data.studentUserId);
    const group = await this.getGroupById(data.groupId);
    await this.checkScoringComponentStarted(group.assessmentId);

    const existing = await this.db.query.groupMembers.findFirst({
      where: and(
        eq(schema.groupMembers.groupId, group.groupId),
        eq(schema.groupMembers.studentUserId, data.studentUserId),
      ),
    });
    if (existing) {
      throw new BadRequestException('This student already joined this group.');
    }

    await this.db
      .insert(schema.groupMembers)
      .values({ ...data, createdDate: new Date() });
    return { studentUserId: data.studentUserId };
  }

  async deleteGroupMember(
    data: DeleteGroupMemberRequest,
  ): Promise<DeleteGroupMemberResponse> {
    await this.userService.getUserById(data.studentUserId);
    const group = await this.getGroupById(data.groupId);
    await this.checkScoringComponentStarted(group.assessmentId);

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

  async getScores(
    groupId: schema.Group['groupId'],
  ): Promise<GetScoresResponse> {
    await this.getGroupById(groupId);

    const groupScore = await this.db.query.groupScores.findFirst({
      where: eq(schema.groupScores.groupId, groupId),
    });

    const studentScores = await this.db.query.studentScores.findMany({
      where: eq(schema.studentScores.groupId, groupId),
    });

    return {
      groupScore: groupScore ?? null,
      studentScores,
    };
  }

  async upsertScore(data: UpsertScoresRequest): Promise<UpsertScoresResponse> {
    const { groupScore: currGroupScore, studentScores: currStudentScores } =
      await this.getScores(data.groupId);

    // upsert group score
    if (!data?.groupScore && currGroupScore) {
      await this.db
        .delete(schema.groupScores)
        .where(eq(schema.groupScores.groupId, data.groupId));
    } else {
      if (currGroupScore) {
        await this.db
          .update(schema.groupScores)
          .set({ score: data.groupScore, updatedDate: new Date() })
          .where(eq(schema.groupScores.groupId, data.groupId));
      } else {
        await this.db.insert(schema.groupScores).values({
          groupId: data.groupId,
          score: data.groupScore,
          createdDate: new Date(),
        });
      }
    }

    // upsert student scores
    const promises = data.studentScores.map(
      ({ studentUserId, score, remark }) => {
        const currStudentScore = currStudentScores.find(
          (item) => item.studentUserId === studentUserId,
        );

        if (!score && currStudentScore?.score) {
          return this.db
            .delete(schema.studentScores)
            .where(
              and(
                eq(schema.studentScores.groupId, data.groupId),
                eq(schema.studentScores.studentUserId, studentUserId),
              ),
            );
        }

        if (score && currStudentScore?.score) {
          return this.db
            .update(schema.studentScores)
            .set({ score, remark: remark ?? null, updatedDate: new Date() })
            .where(
              and(
                eq(schema.studentScores.groupId, data.groupId),
                eq(schema.studentScores.studentUserId, studentUserId),
              ),
            );
        }

        if (score) {
          return this.db.insert(schema.studentScores).values({
            groupId: data.groupId,
            studentUserId,
            score,
            remark,
            createdDate: new Date(),
          });
        }
      },
    );

    await Promise.all(promises);

    return { groupId: data.groupId };
  }

  async checkUserRole(
    assessmentId: schema.Assessment['assessmentId'],
    roleId: schema.User['roleId'],
  ) {
    if (roleId === parseInt(Role.Student)) {
      const scoringComponents =
        await this.assessmentService.getScoringComponentsByAssessmentId({
          assessmentId: assessmentId,
        });

      scoringComponents.forEach((comp) => {
        if (new Date() >= comp.startDate) {
          throw new ForbiddenException(
            'Cannot create or delete groups after scoring has started.',
          );
        }
      });
    }
  }

  async checkScoringComponentStarted(
    assessmentId: schema.Assessment['assessmentId'],
  ) {
    const scoringComponents =
      await this.assessmentService.getScoringComponentsByAssessmentId({
        assessmentId: assessmentId,
      });

    scoringComponents.forEach((comp) => {
      if (new Date() >= comp.startDate) {
        throw new ForbiddenException(
          'Cannot add or remove members after scoring has started.',
        );
      }
    });
  }

  async generateUniqueCode(length = 8): Promise<string> {
    const maxRetries = 5;

    for (let i = 0; i < maxRetries; i++) {
      const code = generateCode(length);

      const groups = await this.db.query.groups.findFirst({
        where: eq(schema.groups.groupCode, code),
      });

      if (!groups) {
        return code;
      }
    }

    throw new Error(
      'Failed to generate a unique group code. Please try again.',
    );
  }
}
