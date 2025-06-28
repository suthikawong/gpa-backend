import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import {
  CreateGroupRequest,
  GetGroupByIdRequest,
  UpdateGroupRequest,
} from './dto/group.request';
import {
  CreateGroupResponse,
  DeleteGroupResponse,
  GetGroupByIdResponse,
  UpdateGroupResponse,
} from './dto/group.response';
import { generateCode } from 'src/utils/generate-code';
import { Group } from '../drizzle/schema';
import { AssessmentService } from '../assessment/assessment.service';

@Injectable()
export class GroupService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,

    private readonly assessmentService: AssessmentService,
  ) {}

  async getGroupById(data: GetGroupByIdRequest): Promise<GetGroupByIdResponse> {
    const group = await this.db.query.groups.findFirst({
      where: eq(schema.groups.groupId, data.groupId),
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async createGroup(
    data: CreateGroupRequest,
    createdBy: schema.User['userId'],
  ): Promise<CreateGroupResponse> {
    await this.assessmentService.getAssessmentById(data.assessmentId);
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

  async deleteGroup(groupId: Group['groupId']): Promise<DeleteGroupResponse> {
    const group = await this.db.query.groups.findFirst({
      where: eq(schema.groups.groupId, groupId),
    });

    if (!group) throw new NotFoundException('Group not found');

    await this.db
      .delete(schema.groups)
      .where(eq(schema.groups.groupId, groupId));

    return { groupId: group.groupId };
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
