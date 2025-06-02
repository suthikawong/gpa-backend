import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import { ModelService } from '../model/model.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import {
  CreateAssignmentRequest,
  MarkGroupRequest,
  UpdateAssignmentRequest,
  UpsertStudentMarksRequest,
} from './dto/assignment.request';
import {
  CreateAssignmentResponse,
  DeleteAssignmentResponse,
  GetAssessmentPeriodsByAssignmentIdResponse,
  GetAssignmentByIdResponse,
  GetCriteriaByAssignmentIdResponse,
  GetGroupMarkByGroupIdResponse,
  GetGroupsByAssignmentIdResponse,
  GetJoinedGroupResponse,
  GetMarkingProgressByAssignmentIdResponse,
  GetMyMarkResponse,
  GetStudentMarksByGroupIdResponse,
  MarkGroupResponse,
  UpdateAssignmentResponse,
  UpsertStudentMarksResponse,
} from './dto/assignment.response';

interface ValidateAssignmentInterface {
  assignmentId?: schema.Assignment['assignmentId'];
  assignmentName: schema.Assignment['assignmentName'];
  isPublished: schema.Assignment['isPublished'];
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
    const result = await this.db
      .select()
      .from(schema.groups)
      .leftJoin(
        schema.groupMarks,
        eq(schema.groups.groupId, schema.groupMarks.groupId),
      )
      .where(eq(schema.groups.assignmentId, assignmentId));

    const groups: GetGroupsByAssignmentIdResponse = [];

    result.forEach((item) => {
      if (
        groups.length === 0 ||
        groups[groups.length - 1].groupId !== item.groups.groupId
      ) {
        groups.push({
          ...item.groups,
          isMarked: item.group_marks ? true : false,
        });
      }
    });

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
    await this.validateAssignment({ ...data, isPublished: false });

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

  async getGroupMark(
    groupId: schema.Group['groupId'],
  ): Promise<GetGroupMarkByGroupIdResponse> {
    const groupMarks = await this.db
      .select()
      .from(schema.groupMarks)
      .innerJoin(
        schema.criteria,
        eq(schema.groupMarks.groupId, groupId) &&
          eq(schema.criteria.criterionId, schema.groupMarks.criterionId),
      )
      .where(and(eq(schema.groupMarks.groupId, groupId)))
      .orderBy(schema.criteria.displayOrder);

    return groupMarks.map((item) => ({
      ...item.criteria,
      mark: item.group_marks,
    }));
  }

  async markGroup(data: MarkGroupRequest): Promise<MarkGroupResponse> {
    await this.db
      .insert(schema.groupMarks)
      .values(
        data.marks.map((item) => ({
          groupId: data.groupId,
          criterionId: item.criterionId,
          mark: item.mark,
        })),
      )
      .returning();
    return { groupId: data.groupId };
  }

  async getStudnetMark(
    groupId: schema.Group['groupId'],
  ): Promise<GetStudentMarksByGroupIdResponse> {
    const [group] = await this.db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.groupId, groupId));

    if (!group) return [];

    const result = await this.db
      .select({
        users: {
          userId: schema.users.userId,
          name: schema.users.name,
          email: schema.users.email,
          roleId: schema.users.roleId,
        },
        student_marks: schema.studentMarks,
      })
      .from(schema.groupMembers)
      .innerJoin(
        schema.users,
        eq(schema.users.userId, schema.groupMembers.studentUserId),
      )
      .leftJoin(
        schema.studentMarks,
        eq(
          schema.studentMarks.studentUserId,
          schema.groupMembers.studentUserId,
        ),
      )
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.studentMarks.assignmentId, group.assignmentId),
        ),
      )
      .orderBy(schema.users.userId);

    return result.map((item) => ({
      ...item.users,
      mark: item.student_marks,
    }));
  }

  async upsertStudentMarks(
    data: UpsertStudentMarksRequest,
  ): Promise<UpsertStudentMarksResponse> {
    const { assignmentId, marks } = data;

    for (const { studentUserId, mark } of marks) {
      const studentMark = await this.db.query.studentMarks.findFirst({
        where: and(
          eq(schema.studentMarks.assignmentId, assignmentId),
          eq(schema.studentMarks.studentUserId, studentUserId),
        ),
      });

      // update
      if (studentMark) {
        await this.db
          .update(schema.studentMarks)
          .set({ mark })
          .where(
            and(
              eq(schema.studentMarks.assignmentId, assignmentId),
              eq(schema.studentMarks.studentUserId, studentUserId),
            ),
          );
      }
      // create
      else {
        await this.db.insert(schema.studentMarks).values({
          assignmentId,
          studentUserId,
          mark,
        });
      }
    }

    return { assignmentId };
  }

  async exportAssignmentScores(
    assignmentId: schema.Assignment['assignmentId'],
  ): Promise<{ filename: string; buffer: ExcelJS.Buffer }> {
    const scores = await this.db
      .select({
        studentUserId: schema.studentMarks.studentUserId,
        mark: schema.studentMarks.mark,
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.studentMarks)
      .innerJoin(
        schema.users,
        eq(schema.users.userId, schema.studentMarks.studentUserId),
      )
      .where(eq(schema.studentMarks.assignmentId, assignmentId));

    const [assignmentInfo] = await this.db
      .select({
        assignmentName: schema.assignments.assignmentName,
        classroomName: schema.classrooms.classroomName,
      })
      .from(schema.assignments)
      .innerJoin(
        schema.classrooms,
        eq(schema.classrooms.classroomId, schema.assignments.classroomId),
      )
      .where(eq(schema.assignments.assignmentId, assignmentId));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('scores');

    worksheet.columns = [
      { header: 'Student Name', key: 'name', width: 40 },
      { header: 'Score', key: 'mark', width: 10 },
    ];

    scores.forEach((s) => {
      worksheet.addRow({
        name: s.name,
        mark: s.mark,
      });
    });

    worksheet.insertRow(1, [
      `Scores for ${assignmentInfo.assignmentName} (${assignmentInfo.classroomName})`,
    ]);
    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').font = { size: 14, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${assignmentInfo.assignmentName.toLowerCase().replace(/ /g, '-')}-scores.xlsx`;

    return { filename, buffer };
  }

  async getMyMark(
    assignmentId: schema.Assignment['assignmentId'],
    studentUserId: schema.User['userId'],
  ): Promise<GetMyMarkResponse> {
    const result = await this.db.query.studentMarks.findFirst({
      where: and(
        eq(schema.studentMarks.assignmentId, assignmentId),
        eq(schema.studentMarks.studentUserId, studentUserId),
      ),
    });
    return {
      mark: result?.mark ?? null,
    };
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
    if (data.assignmentId && data.isPublished) {
      await this.validateAssignmentBeforePublish(data.assignmentId);
    }
  }

  async validateAssignmentBeforePublish(
    assignmentId: schema.Assignment['assignmentId'],
  ) {
    // validate criteria
    const criteria = await this.getCriteriaByAssignmentId(assignmentId);
    if (criteria.length === 0) {
      throw new BadRequestException(
        `Criterion must be added to publish an assignment`,
      );
    }
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
