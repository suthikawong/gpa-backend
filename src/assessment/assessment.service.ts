import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, gte, ilike, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { generateCode } from '../utils/generate-code';
import {
  CheckScoringComponentActiveRequest,
  ConfirmStudentJoinAssessmentRequest,
  CreateAssessmentRequest,
  DeleteAssessmentRequest,
  GetGroupsByAssessmentIdRequest,
  GetScoringComponentsByAssessmentIdRequest,
  RemoveStudentFromAssessmentRequest,
  SearchStudentsInAssessmentRequest,
  StudentJoinAssessmentRequest,
  UpdateAssessmentRequest,
} from './dto/assessment.request';
import {
  CheckScoringComponentActiveResponse,
  ConfirmStudentJoinAssessmentResponse,
  CreateAssessmentResponse,
  DeleteAssessmentResponse,
  GetAssessmentByIdResponse,
  GetAssessmentsByInstructorResponse,
  GetAssessmentsByStudentResponse,
  GetGroupsByAssessmentIdResponse,
  GetMyScoreResponse,
  GetScoringComponentsByAssessmentIdResponse,
  GetStudentJoinedGroupResponse,
  RemoveStudentFromAssessmentResponse,
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

    const { refreshToken, password, ...instructor } = result?.users ?? null;
    return { ...result?.assessments, instructor, canEdit: !exist };
  }

  async getAssessmentsByInstructor(
    instructorUserId: schema.Assessment['instructorUserId'],
  ): Promise<GetAssessmentsByInstructorResponse> {
    const assessments = await this.db.query.assessments.findMany({
      where: eq(schema.assessments.instructorUserId, instructorUserId),
    });

    const data = assessments.map(({ modelId, modelConfig, ...data }) => data);

    return data;
  }

  async getAssessmentsByStudent(
    studentUserId: schema.User['userId'],
  ): Promise<GetAssessmentsByStudentResponse> {
    const entries = await this.db
      .select()
      .from(schema.assessmentStudent)
      .innerJoin(
        schema.assessments,
        eq(
          schema.assessmentStudent.assessmentId,
          schema.assessments.assessmentId,
        ),
      )
      .where(
        and(
          eq(schema.assessmentStudent.studentUserId, studentUserId),
          eq(schema.assessmentStudent.isConfirmed, true),
          eq(schema.assessments.isPublished, true),
        ),
      );

    const data = entries.map(({ assessments }) => {
      const { modelId, modelConfig, ...data } = assessments;
      return data;
    });

    return data;
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

    const [assessment] = await this.db
      .update(schema.assessments)
      .set({
        ...data,
        updatedDate: new Date(),
      })
      .where(eq(schema.assessments.assessmentId, data.assessmentId))
      .returning();

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
        roleId: schema.users.roleId,
        isConfirmed: schema.assessmentStudent.isConfirmed,
        joinedGroupId: schema.groupMembers.groupId,
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
      .where(and(...condition));

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
      where: eq(schema.assessments.assessmentCode, data.assessmentCode),
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
    await this.db
      .delete(schema.assessmentStudent)
      .where(
        and(
          eq(schema.assessmentStudent.assessmentId, data.assessmentId),
          eq(schema.assessmentStudent.studentUserId, data.studentUserId),
        ),
      );

    const [result] = await this.db
      .select({
        groupId: schema.groupMembers.groupId,
      })
      .from(schema.assessmentStudent)
      .innerJoin(
        schema.users,
        eq(schema.assessmentStudent.studentUserId, schema.users.userId),
      )
      .leftJoin(
        schema.groupMembers,
        eq(schema.groupMembers.studentUserId, schema.users.userId),
      )
      .where(eq(schema.assessmentStudent.assessmentId, data.assessmentId));

    if (result?.groupId) {
      await this.db
        .delete(schema.groupMembers)
        .where(
          and(
            eq(schema.groupMembers.groupId, result.groupId),
            eq(schema.groupMembers.studentUserId, data.studentUserId),
          ),
        );
    }

    return { studentUserId: data.studentUserId };
  }

  async getScoringComponentsByAssessmentId(
    data: GetScoringComponentsByAssessmentIdRequest,
  ): Promise<GetScoringComponentsByAssessmentIdResponse> {
    await this.getAssessmentById(data.assessmentId);
    const result = await this.db.query.scoringComponents.findMany({
      where: eq(schema.scoringComponents.assessmentId, data.assessmentId),
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
      .where(eq(schema.groupMembers.studentUserId, studentUserId));

    if (!result) return null;

    const { groups: group } = result;

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
      .where(eq(schema.groupMembers.groupId, group.groupId));

    return { ...group, members };
  }

  async getGroupsByAssessmentId(
    data: GetGroupsByAssessmentIdRequest,
  ): Promise<GetGroupsByAssessmentIdResponse> {
    await this.getAssessmentById(data.assessmentId);
    const result = await this.db.query.groups.findMany({
      where: eq(schema.groups.assessmentId, data.assessmentId),
    });
    return result;
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

    if (!result?.groups) {
      throw new NotFoundException(
        'Student is not in any group of this assessment',
      );
    }

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
