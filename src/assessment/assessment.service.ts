import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { and, asc, count, desc, eq, gte, ilike, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import ExcelJS from 'exceljs';
import { AssessmentModel, Role } from '../app.config';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { UserProtected } from '../user/user.interface';
import { generateCode } from '../utils/generate-code';
import {
  AddStudentByEmailRequest,
  CheckScoringComponentActiveRequest,
  ConfirmStudentJoinAssessmentRequest,
  CreateAssessmentRequest,
  DeleteAllGroupsByAssessmentIdRequest,
  DeleteAssessmentRequest,
  GetGroupsByAssessmentIdRequest,
  GetScoringComponentsByAssessmentIdRequest,
  RemoveStudentFromAssessmentRequest,
  SearchAssessmentsByInstructorRequest,
  SearchAssessmentsByStudentRequest,
  SearchStudentsInAssessmentRequest,
  StudentJoinAssessmentRequest,
  UpdateAssessmentRequest,
} from './dto/assessment.request';
import {
  AddStudentByEmailResponse,
  CheckScoringComponentActiveResponse,
  ConfirmStudentJoinAssessmentResponse,
  CreateAssessmentResponse,
  DeleteAllGroupsByAssessmentIdResponse,
  DeleteAssessmentResponse,
  GetAssessmentByIdResponse,
  GetGroupsByAssessmentIdResponse,
  GetMyScoreResponse,
  GetScoringComponentsByAssessmentIdResponse,
  GetStudentJoinedGroupResponse,
  RemoveStudentFromAssessmentResponse,
  SearchAssessmentsByInstructorResponse,
  SearchAssessmentsByStudentResponse,
  SearchStudentsInAssessmentResponse,
  StudentJoinAssessmentResponse,
  UpdateAssessmentResponse,
} from './dto/assessment.response';

@Injectable()
export class AssessmentService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getAssessmentById(
    assessmentId: schema.Assessment['assessmentId'],
  ): Promise<GetAssessmentByIdResponse> {
    const [result] = await this.db
      .select()
      .from(schema.assessments)
      .innerJoin(
        schema.users,
        eq(schema.assessments.instructorUserId, schema.users.userId),
      )
      .where(eq(schema.assessments.assessmentId, assessmentId));

    if (!result?.assessments) {
      throw new NotFoundException('Assessment not found');
    }

    const exist = await this.db.query.scoringComponents.findFirst({
      where: and(
        eq(schema.scoringComponents.assessmentId, assessmentId),
        lte(schema.scoringComponents.startDate, new Date()),
      ),
    });

    return {
      ...result?.assessments,
      instructor: plainToInstance(UserProtected, result?.users) ?? null,
      canEdit: !exist,
    };
  }

  async searchAssessmentsByInstructor(
    data: SearchAssessmentsByInstructorRequest,
    instructorUserId: schema.User['userId'],
  ): Promise<{
    assessments: SearchAssessmentsByInstructorResponse;
    total: number;
  }> {
    const condition = [
      eq(schema.assessments.instructorUserId, instructorUserId),
    ];

    if (data.keyword) {
      condition.push(
        ilike(schema.assessments.assessmentName, `%${data.keyword}%`),
      );
    }

    const query = this.db
      .select()
      .from(schema.assessments)
      .where(and(...condition))
      .orderBy(desc(schema.assessments.createdDate));

    if (data.limit !== undefined && data.offset !== undefined) {
      query.limit(data.limit).offset(data.offset);
    }

    const assessments = await query;

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.assessments)
      .where(and(...condition))
      .limit(1);

    return { assessments, total };
  }

  async searchAssessmentsByStudent(
    data: SearchAssessmentsByStudentRequest,
    studentUserId: schema.User['userId'],
  ): Promise<{
    assessments: SearchAssessmentsByStudentResponse;
    total: number;
  }> {
    const condition = [
      eq(schema.assessmentStudent.studentUserId, studentUserId),
      eq(schema.assessmentStudent.isConfirmed, true),
      eq(schema.assessments.isPublished, true),
    ];

    if (data.keyword) {
      condition.push(
        ilike(schema.assessments.assessmentName, `%${data.keyword}%`),
      );
    }

    const query = this.db
      .select()
      .from(schema.assessmentStudent)
      .innerJoin(
        schema.assessments,
        eq(
          schema.assessmentStudent.assessmentId,
          schema.assessments.assessmentId,
        ),
      )
      .where(and(...condition))
      .orderBy(desc(schema.assessments.createdDate));

    if (data.limit !== undefined && data.offset !== undefined) {
      query.limit(data.limit).offset(data.offset);
    }

    const entries = await query;

    const assessments = entries.map(({ assessments }) => {
      const { modelId, modelConfig, ...data } = assessments;
      return data;
    });

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.assessmentStudent)
      .innerJoin(
        schema.assessments,
        eq(
          schema.assessmentStudent.assessmentId,
          schema.assessments.assessmentId,
        ),
      )
      .where(and(...condition))
      .limit(1);

    return { assessments, total };
  }

  async createAssessment(
    data: CreateAssessmentRequest,
    instructorUserId: schema.Assessment['instructorUserId'],
  ): Promise<CreateAssessmentResponse> {
    const assessmentCode = await this.generateUniqueCode();

    const [assessment] = await this.db
      .insert(schema.assessments)
      .values({
        assessmentName: data.assessmentName,
        assessmentCode: assessmentCode,
        isPublished: false,
        instructorUserId: instructorUserId,
        createdDate: new Date(),
      })
      .returning();

    return assessment;
  }

  async updateAssessment(
    data: UpdateAssessmentRequest,
  ): Promise<UpdateAssessmentResponse> {
    const existing = await this.db.query.assessments.findFirst({
      where: eq(schema.assessments.assessmentId, data.assessmentId),
    });

    if (!existing) throw new NotFoundException('Assessment not found');

    const hasModelId = data.modelId || existing.modelId;
    const hasModelConfig = data.modelConfig || existing.modelConfig;

    if (data.isPublished && !hasModelId && !hasModelConfig) {
      throw new BadRequestException(
        'Assessment model must be specify before publish assessment.',
      );
    }

    const assessment = await this.db.transaction(async (tx) => {
      // update group scores when modelId was changed
      if (hasModelId && data.modelId !== existing.modelId) {
        let newGroupScores: schema.GroupScore[] = [];
        const groupScores = await this.db
          .select()
          .from(schema.groups)
          .innerJoin(
            schema.groupScores,
            eq(schema.groups.groupId, schema.groupScores.groupId),
          )
          .where(eq(schema.groups.assessmentId, data.assessmentId));

        if (data.modelId === AssessmentModel.QASS) {
          newGroupScores = groupScores.map((item) => ({
            ...item.group_scores,
            score: item.group_scores?.score * 0.05,
          }));
        } else if (data.modelId === AssessmentModel.WebAVALIA) {
          newGroupScores = groupScores.map((item) => ({
            ...item.group_scores,
            score: Math.round(item.group_scores?.score * 20),
          }));
        }
        if (newGroupScores.length > 0) {
          const promises = newGroupScores.map((item) =>
            tx
              .update(schema.groupScores)
              .set({
                ...item,
                updatedDate: new Date(),
              })
              .where(eq(schema.groupScores.groupScoreId, item.groupScoreId)),
          );
          await Promise.all(promises);
        }
      }

      // update assessment
      const [assessment] = await tx
        .update(schema.assessments)
        .set({
          ...data,
          updatedDate: new Date(),
        })
        .where(eq(schema.assessments.assessmentId, data.assessmentId))
        .returning();

      return assessment;
    });
    return assessment;
  }

  async deleteAssessment(
    data: DeleteAssessmentRequest,
  ): Promise<DeleteAssessmentResponse> {
    const existing = await this.db.query.assessments.findFirst({
      where: eq(schema.assessments.assessmentId, data.assessmentId),
    });

    if (!existing) {
      throw new NotFoundException('Assessment not found');
    }

    await this.db
      .delete(schema.assessments)
      .where(eq(schema.assessments.assessmentId, data.assessmentId));

    return { assessmentId: data.assessmentId };
  }

  async searchStudentsInAssessment(
    data: SearchStudentsInAssessmentRequest,
  ): Promise<{ students: SearchStudentsInAssessmentResponse; total: number }> {
    await this.getAssessmentById(data.assessmentId);

    const condition = [
      eq(schema.assessmentStudent.assessmentId, data.assessmentId),
    ];

    if (data.keyword) {
      condition.push(ilike(schema.users.name, `%${data.keyword}%`));
    }

    const query = this.db
      .select({
        userId: schema.users.userId,
        name: schema.users.name,
        email: schema.users.email,
        image: schema.users.image,
        userNumber: schema.users.userNumber,
        roleId: schema.users.roleId,
        isConfirmed: schema.assessmentStudent.isConfirmed,
        group: schema.groups,
      })
      .from(schema.assessmentStudent)
      .innerJoin(
        schema.users,
        eq(schema.assessmentStudent.studentUserId, schema.users.userId),
      )
      .leftJoin(
        schema.groupMembers,
        and(
          eq(schema.groupMembers.studentUserId, schema.users.userId),
          eq(
            schema.groupMembers.assessmentId,
            schema.assessmentStudent.assessmentId,
          ),
        ),
      )
      .leftJoin(
        schema.groups,
        eq(schema.groupMembers.groupId, schema.groups.groupId),
      )
      .where(and(...condition))
      .orderBy(asc(schema.users.userId));

    if (data.limit !== undefined && data.offset !== undefined) {
      query.limit(data.limit).offset(data.offset);
    }

    const students = await query;

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.assessmentStudent)
      .innerJoin(
        schema.users,
        eq(schema.assessmentStudent.studentUserId, schema.users.userId),
      )
      .where(and(...condition))
      .limit(1);

    return { students, total };
  }

  async studentJoinAssessment(
    data: StudentJoinAssessmentRequest,
    studentUserId: schema.AssessmentStudent['studentUserId'],
  ): Promise<StudentJoinAssessmentResponse> {
    const assessment = await this.db.query.assessments.findFirst({
      where: and(
        eq(schema.assessments.assessmentCode, data.assessmentCode),
        eq(schema.assessments.isPublished, true),
      ),
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found with provided code');
    }

    const existing = await this.db.query.assessmentStudent.findFirst({
      where: and(
        eq(schema.assessmentStudent.assessmentId, assessment.assessmentId),
        eq(schema.assessmentStudent.studentUserId, studentUserId),
      ),
    });

    if (existing) {
      throw new BadRequestException('You already joined this assessment');
    }

    const [assessmentStudent] = await this.db
      .insert(schema.assessmentStudent)
      .values({
        assessmentId: assessment.assessmentId,
        studentUserId: studentUserId,
        isConfirmed: false,
        createdDate: new Date(),
      })
      .returning();

    return { studentUserId: assessmentStudent.studentUserId };
  }

  async addStudentByEmail(
    data: AddStudentByEmailRequest,
  ): Promise<AddStudentByEmailResponse> {
    const assessment = await this.db.query.assessments.findFirst({
      where: eq(schema.assessments.assessmentId, data.assessmentId),
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    const user = await this.db.query.users.findFirst({
      where: and(
        eq(schema.users.email, data.email),
        eq(schema.users.roleId, parseInt(Role.Student)),
      ),
    });

    if (!user) {
      throw new NotFoundException(
        'No account was found with this email address',
      );
    }

    const existing = await this.db.query.assessmentStudent.findFirst({
      where: and(
        eq(schema.assessmentStudent.assessmentId, assessment.assessmentId),
        eq(schema.assessmentStudent.studentUserId, user.userId),
      ),
    });

    if (existing) {
      throw new BadRequestException('Student already joined this assessment');
    }

    const [assessmentStudent] = await this.db
      .insert(schema.assessmentStudent)
      .values({
        assessmentId: assessment.assessmentId,
        studentUserId: user.userId,
        isConfirmed: true,
        createdDate: new Date(),
      })
      .returning();

    return { studentUserId: assessmentStudent.studentUserId };
  }

  async confirmStudentJoinAssessment(
    data: ConfirmStudentJoinAssessmentRequest,
  ): Promise<ConfirmStudentJoinAssessmentResponse> {
    await this.getAssessmentById(data.assessmentId);
    const existing = await this.db.query.assessmentStudent.findFirst({
      where: and(
        eq(schema.assessmentStudent.assessmentId, data.assessmentId),
        eq(schema.assessmentStudent.studentUserId, data.studentUserId),
      ),
    });

    if (!existing) {
      throw new NotFoundException(
        `This student didn't request to join the assessment yet`,
      );
    }

    if (data.isConfirmed) {
      await this.db
        .update(schema.assessmentStudent)
        .set({ isConfirmed: true, updatedDate: new Date() })
        .where(
          eq(
            schema.assessmentStudent.assessmentStudentId,
            existing.assessmentStudentId,
          ),
        );
    } else {
      await this.db
        .delete(schema.assessmentStudent)
        .where(
          eq(
            schema.assessmentStudent.assessmentStudentId,
            existing.assessmentStudentId,
          ),
        );
    }
    return { studentUserId: data.studentUserId };
  }

  async removeStudentFromAssessment(
    data: RemoveStudentFromAssessmentRequest,
  ): Promise<RemoveStudentFromAssessmentResponse> {
    await this.getAssessmentById(data.assessmentId);
    const [joined] = await this.db
      .select()
      .from(schema.assessmentStudent)
      .where(
        and(
          eq(schema.assessmentStudent.assessmentId, data.assessmentId),
          eq(schema.assessmentStudent.studentUserId, data.studentUserId),
        ),
      );

    if (!joined) {
      throw new BadRequestException(
        'This student did not participate in the assessment',
      );
    }

    const [result] = await this.db
      .select({
        groupId: schema.groupMembers.groupId,
      })
      .from(schema.groupMembers)
      .where(eq(schema.groupMembers.studentUserId, data.studentUserId));

    await this.db.transaction(async (tx) => {
      await tx
        .delete(schema.assessmentStudent)
        .where(
          and(
            eq(schema.assessmentStudent.assessmentId, data.assessmentId),
            eq(schema.assessmentStudent.studentUserId, data.studentUserId),
          ),
        );

      if (result?.groupId) {
        await tx
          .delete(schema.groupMembers)
          .where(
            and(
              eq(schema.groupMembers.groupId, result.groupId),
              eq(schema.groupMembers.studentUserId, data.studentUserId),
            ),
          );
        await tx
          .delete(schema.studentScores)
          .where(
            and(
              eq(schema.studentScores.groupId, result.groupId),
              eq(schema.studentScores.studentUserId, data.studentUserId),
            ),
          );
      }
    });

    return { studentUserId: data.studentUserId };
  }

  async getScoringComponentsByAssessmentId(
    data: GetScoringComponentsByAssessmentIdRequest,
  ): Promise<GetScoringComponentsByAssessmentIdResponse> {
    await this.getAssessmentById(data.assessmentId);
    const result = await this.db.query.scoringComponents.findMany({
      where: eq(schema.scoringComponents.assessmentId, data.assessmentId),
      orderBy: [asc(schema.scoringComponents.startDate)],
    });
    return result;
  }

  async getStudentJoinedGroup(
    assessmentId: schema.Assessment['assessmentId'],
    studentUserId: schema.User['userId'],
  ): Promise<GetStudentJoinedGroupResponse> {
    await this.getAssessmentById(assessmentId);
    const [result] = await this.db
      .select()
      .from(schema.groups)
      .innerJoin(
        schema.groupMembers,
        eq(schema.groups.groupId, schema.groupMembers.groupId),
      )
      .where(
        and(
          eq(schema.groups.assessmentId, assessmentId),
          eq(schema.groupMembers.studentUserId, studentUserId),
        ),
      );

    if (!result) return null;

    const { groups: group } = result;

    const members = await this.db
      .select({
        userId: schema.users.userId,
        name: schema.users.name,
        email: schema.users.email,
        image: schema.users.image,
        userNumber: schema.users.userNumber,
        roleId: schema.users.roleId,
      })
      .from(schema.groupMembers)
      .innerJoin(
        schema.users,
        eq(schema.groupMembers.studentUserId, schema.users.userId),
      )
      .where(eq(schema.groupMembers.groupId, group.groupId));

    return { ...group, members };
  }

  async getGroupsByAssessmentId(
    data: GetGroupsByAssessmentIdRequest,
  ): Promise<GetGroupsByAssessmentIdResponse> {
    await this.getAssessmentById(data.assessmentId);
    const result = await this.db.query.groups.findMany({
      where: eq(schema.groups.assessmentId, data.assessmentId),
      orderBy: asc(schema.groups.groupId),
    });
    return result;
  }

  async deleteAllGroupsByAssessmentId(
    data: DeleteAllGroupsByAssessmentIdRequest,
  ): Promise<DeleteAllGroupsByAssessmentIdResponse> {
    await this.getAssessmentById(data.assessmentId);
    await this.db
      .delete(schema.groups)
      .where(eq(schema.groups.assessmentId, data.assessmentId));
    return { assessmentId: data.assessmentId };
  }

  async getMyScore(
    assessmentId: schema.Assessment['assessmentId'],
    studentUserId: schema.StudentScore['studentUserId'],
  ): Promise<GetMyScoreResponse> {
    const [result] = await this.db
      .select()
      .from(schema.groups)
      .innerJoin(
        schema.groupMembers,
        eq(schema.groups.groupId, schema.groupMembers.groupId),
      )
      .where(
        and(
          eq(schema.groups.assessmentId, assessmentId),
          eq(schema.groupMembers.studentUserId, studentUserId),
        ),
      );

    if (!result?.groups) return null;

    const { groups: group } = result;

    const studentScore = await this.db.query.studentScores.findFirst({
      columns: {
        studentUserId: true,
        score: true,
      },
      where: and(
        eq(schema.studentScores.groupId, group.groupId),
        eq(schema.studentScores.studentUserId, studentUserId),
      ),
    });

    return studentScore ?? null;
  }

  async checkScoringComponentActive(
    data: CheckScoringComponentActiveRequest,
    studentUserId: schema.User['userId'],
  ): Promise<CheckScoringComponentActiveResponse> {
    const scoringComponent = await this.db.query.scoringComponents.findFirst({
      where: and(
        eq(schema.scoringComponents.assessmentId, data.assessmentId),
        lte(schema.scoringComponents.startDate, new Date()),
        gte(schema.scoringComponents.endDate, new Date()),
      ),
    });

    if (!scoringComponent) return null;

    const peerRating = await this.db.query.peerRatings.findFirst({
      where: and(
        eq(
          schema.peerRatings.scoringComponentId,
          scoringComponent.scoringComponentId,
        ),
        eq(schema.peerRatings.raterStudentUserId, studentUserId),
      ),
    });

    return {
      scoringComponentId: scoringComponent.scoringComponentId,
      rated: !!peerRating,
    };
  }

  async exportAssessmentScores(
    assessmentId: schema.Assessment['assessmentId'],
  ): Promise<{ filename: string; buffer: ExcelJS.Buffer }> {
    const assessment = await this.db.query.assessments.findFirst({
      where: eq(schema.assessments.assessmentId, assessmentId),
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    const data = await this.db
      .select({
        studentUserId: schema.studentScores.studentUserId,
        groupScore: schema.groupScores.score,
        studentScore: schema.studentScores.score,
        name: schema.users.name,
        email: schema.users.email,
        userNumber: schema.users.userNumber,
      })
      .from(schema.studentScores)
      .innerJoin(
        schema.users,
        eq(schema.users.userId, schema.studentScores.studentUserId),
      )
      .innerJoin(
        schema.groups,
        eq(schema.groups.groupId, schema.studentScores.groupId),
      )
      .innerJoin(
        schema.groupScores,
        eq(schema.groupScores.groupId, schema.studentScores.groupId),
      )
      .innerJoin(
        schema.assessments,
        eq(schema.assessments.assessmentId, schema.groups.assessmentId),
      )
      .where(eq(schema.assessments.assessmentId, assessmentId))
      .orderBy(schema.groups.groupId, schema.users.userId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Result');

    worksheet.columns = [
      {
        header: 'Student Name',
        key: 'name',
        width: 30,
      },
      {
        header: 'Student ID',
        key: 'userNumber',
        width: 20,
      },
      {
        header: 'Student Email',
        key: 'email',
        width: 30,
      },
      {
        header: 'Group Score',
        key: 'groupScore',
        width: 20,
      },
      {
        header: 'Student Score',
        key: 'studentScore',
        width: 20,
      },
    ];

    data.forEach((s) => {
      worksheet.addRow({
        name: s.name,
        userNumber: s.userNumber,
        email: s.email,
        groupScore: s.groupScore > 1 ? s.groupScore : s.groupScore * 100,
        studentScore:
          s.studentScore > 1 ? s.studentScore : s.studentScore * 100,
      });
    });

    worksheet.insertRow(1, [assessment.assessmentName]);
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').font = { size: 14, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.insertRow(2, '');
    worksheet.getCell('A3').font = { size: 11, bold: true };
    worksheet.getCell('B3').font = { size: 11, bold: true };
    worksheet.getCell('C3').font = { size: 11, bold: true };
    worksheet.getCell('D3').font = { size: 11, bold: true };
    worksheet.getCell('E3').font = { size: 11, bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = 'export-scores.xlsx';

    return { filename, buffer };
  }

  async generateUniqueCode(length = 8): Promise<string> {
    const maxRetries = 5;

    for (let i = 0; i < maxRetries; i++) {
      const code = generateCode(length);

      const assessments = await this.db.query.assessments.findFirst({
        where: eq(schema.assessments.assessmentCode, code),
      });

      if (!assessments) {
        return code;
      }
    }

    throw new Error(
      'Failed to generate a unique assessment code. Please try again.',
    );
  }
}
