import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
} from './dto/assignment.request';
import {
  CreateAssignmentResponse,
  DeleteAssignmentResponse,
  GetAssignmentByIdResponse,
  UpdateAssignmentResponse,
} from './dto/assignment.response';

interface ValidateAssignmentInterface {
  assignmentId?: schema.Assignment['assignmentId'];
  assignmentName: schema.Assignment['assignmentName'];
  classroomId: schema.Assignment['classroomId'];
}

@Injectable()
export class AssignmentService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getAssignmentById(
    assignmentId: schema.Assignment['assignmentId'],
  ): Promise<GetAssignmentByIdResponse> {
    const [assignment] = await this.db
      .select()
      .from(schema.assignments)
      .where(eq(schema.assignments.assignmentId, assignmentId));

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    let modelConfiguration: schema.ModelConfiguration | null = null;
    let model: schema.Model | null = null;

    if (assignment?.modelConfigurationId) {
      const [config] = await this.db
        .select()
        .from(schema.modelConfigurations)
        .where(
          eq(
            schema.modelConfigurations.modelConfigurationId,
            assignment.modelConfigurationId,
          ),
        );
      modelConfiguration = config;

      const [mod] = await this.db
        .select()
        .from(schema.models)
        .where(eq(schema.models.modelId, modelConfiguration.modelId));
      model = mod;
    }

    const groupList = await this.db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.assignmentId, assignmentId));

    const criteriaList = await this.db
      .select()
      .from(schema.criteria)
      .where(eq(schema.criteria.assignmentId, assignmentId));

    const periods = await this.db
      .select()
      .from(schema.assessmentPeriods)
      .where(eq(schema.assessmentPeriods.assignmentId, assignmentId));

    const marks = await this.db
      .select()
      .from(schema.groupMarks)
      .where(
        inArray(
          schema.groupMarks.groupId,
          groupList.map((g) => g.groupId),
        ),
      );

    const totalGroups = groupList.length;
    const markedGroups = marks.length;

    const response: GetAssignmentByIdResponse = {
      ...assignment,
      model,
      modelConfiguration,
      groups: groupList,
      criteria: criteriaList,
      assessmentPeriods: periods,
      isEnded: new Date(assignment.dueDate) < new Date(),
      markingProgress: (markedGroups / totalGroups) * 100,
    };

    return response;
  }

  async create(
    data: CreateAssignmentRequest,
  ): Promise<CreateAssignmentResponse> {
    await this.validateAssignment(data);

    const [assignment] = await this.db
      .insert(schema.assignments)
      .values({
        assignmentName: data.assignmentName,
        isPublished: false,
        dueDate: new Date(data.dueDate),
        classroomId: data.classroomId,
        createdDate: new Date(),
      })
      .returning();

    return assignment;
  }

  async update(
    data: UpdateAssignmentRequest,
  ): Promise<UpdateAssignmentResponse> {
    await this.validateAssignment(data);

    const [assignment] = await this.db
      .update(schema.assignments)
      .set({
        assignmentName: data.assignmentName,
        modelConfigurationId: data.modelConfigurationId,
        isPublished: data.isPublished,
        dueDate: new Date(data.dueDate),
        updatedDate: new Date(),
      })
      .where(eq(schema.assignments.assignmentId, data.assignmentId))
      .returning();

    return assignment;
  }

  async delete(
    assignmentId: schema.Assignment['assignmentId'],
  ): Promise<DeleteAssignmentResponse> {
    await this.getAssignmentById(assignmentId);

    await this.db
      .delete(schema.assignments)
      .where(eq(schema.assignments.assignmentId, assignmentId));

    return { assignmentId };
  }

  async validateAssignment(data: ValidateAssignmentInterface) {
    if (data?.assignmentId) {
      await this.getAssignmentById(data.assignmentId);
    }
    await this.validateAssignmentName(
      data.classroomId,
      data.assignmentName,
      data?.assignmentId,
    );
  }

  async validateAssignmentName(
    classroomId: schema.Assignment['classroomId'],
    assignmentName: schema.Assignment['assignmentName'],
    excludeAssignmentId?: schema.Assignment['assignmentId'],
  ) {
    const conditions = [
      eq(schema.assignments.assignmentName, assignmentName),
      eq(schema.assignments.classroomId, classroomId),
    ];

    if (excludeAssignmentId) {
      conditions.push(ne(schema.assignments.assignmentId, excludeAssignmentId));
    }

    const [existing] = await this.db
      .select()
      .from(schema.assignments)
      .where(and(...conditions));

    if (existing) {
      throw new BadRequestException('Assignment name already exists.');
    }
  }
}
