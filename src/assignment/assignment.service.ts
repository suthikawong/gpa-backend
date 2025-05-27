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
  GetAssessmentPeriodsByAssignmentIdResponse,
  GetAssignmentByIdResponse,
  GetCriteriaByAssignmentIdResponse,
  GetGroupsByAssignmentIdResponse,
  GetJoinedGroupResponse,
  GetMarkingProgressByAssignmentIdResponse,
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

    const response: GetAssignmentByIdResponse = {
      ...assignment,
      isEnded: new Date(assignment.dueDate) < new Date(),
    };
    return response;
  }

  async getGroupsByAssignmentId(
    assignmentId: schema.Assignment['assignmentId'],
  ): Promise<GetGroupsByAssignmentIdResponse> {
    const groups = await this.db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.assignmentId, assignmentId));
    return groups;
  }

  async getCriteriaByAssignmentId(
    assignmentId: schema.Assignment['assignmentId'],
  ): Promise<GetCriteriaByAssignmentIdResponse> {
    const criteria = await this.db
      .select()
      .from(schema.criteria)
      .where(eq(schema.criteria.assignmentId, assignmentId));
    return criteria;
  }

  async getAssessmentPeriodsByAssignmentId(
    assignmentId: schema.Assignment['assignmentId'],
  ): Promise<GetAssessmentPeriodsByAssignmentIdResponse> {
    const periods = await this.db
      .select()
      .from(schema.assessmentPeriods)
      .leftJoin(
        schema.questions,
        eq(
          schema.assessmentPeriods.assessmentPeriodId,
          schema.questions.assessmentPeriodId,
        ),
      )
      .where(eq(schema.assessmentPeriods.assignmentId, assignmentId))
      .orderBy(schema.assessmentPeriods.assessmentPeriodId);

    const assessmentPeriods: GetAssessmentPeriodsByAssignmentIdResponse = [];

    periods.forEach((item) => {
      if (
        assessmentPeriods.length === 0 ||
        assessmentPeriods[assessmentPeriods.length - 1].assessmentPeriodId !==
          item.assessment_periods.assessmentPeriodId
      ) {
        assessmentPeriods.push({
          ...item.assessment_periods,
          questions: item.questions
            ? Array.isArray(item.questions)
              ? item.questions
              : [item.questions]
            : [],
        });
      } else if (item.questions) {
        assessmentPeriods[assessmentPeriods.length - 1].questions.push(
          item.questions,
        );
      }
    });

    return assessmentPeriods;
  }

  async getMarkingProgressByAssignmentId(
    assignmentId: schema.Assignment['assignmentId'],
  ): Promise<GetMarkingProgressByAssignmentIdResponse> {
    const groupList = await this.db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.assignmentId, assignmentId));

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

    return {
      markingProgress: (markedGroups / totalGroups) * 100,
    };
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

  async getJoinedGroup(
    studentUserId: schema.User['userId'],
    assignmentId: schema.Assignment['assignmentId'],
  ): Promise<GetJoinedGroupResponse> {
    const [result] = await this.db
      .select()
      .from(schema.groupMembers)
      .innerJoin(
        schema.groups,
        eq(schema.groupMembers.groupId, schema.groups.groupId),
      )
      .leftJoin(
        schema.users,
        eq(schema.groupMembers.studentUserId, schema.users.userId),
      )
      .where(
        and(
          eq(schema.groupMembers.studentUserId, studentUserId),
          eq(schema.groups.assignmentId, assignmentId),
        ),
      )
      .limit(1);

    const group: GetJoinedGroupResponse = result.groups
      ? { ...result.groups, members: [] }
      : null;

    if (group) {
      const groupMembers = await this.db
        .select()
        .from(schema.groupMembers)
        .innerJoin(
          schema.users,
          eq(schema.groupMembers.studentUserId, schema.users.userId),
        )
        .where(and(eq(schema.groupMembers.groupId, group.groupId)));

      groupMembers.forEach((item) => {
        const temp = {
          ...item.users,
          refreshToken: undefined,
          password: undefined,
        };
        group.members.push(temp);
      });
    }

    return group;
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
