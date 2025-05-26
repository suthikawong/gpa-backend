import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import { generateCode } from 'src/utils/generate-code';
import * as schema from '../drizzle/schema';
import { CreateGroupRequest, UpdateGroupRequest } from './dto/group.request';
import {
  CreateGroupResponse,
  DeleteGroupResponse,
  GetGroupByIdResponse,
  UpdateGroupResponse,
} from './dto/group.response';
import { AssignmentService } from 'src/assignment/assignment.service';

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

  async validateGroup(data: ValidateGroupInterface) {
    let assignmentId: schema.Group['assignmentId'];
    if (data?.groupId) {
      const group = await this.getGroupById(data.groupId);
      assignmentId = group.assignmentId;
    } else {
      assignmentId = data.assignmentId!;
      await this.assignmentService.getAssignmentById(assignmentId);
    }
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
