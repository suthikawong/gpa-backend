import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { generateCode } from 'src/utils/generate-code';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import {
  CreateAssessmentRequest,
  DeleteAssessmentRequest,
  UpdateAssessmentRequest,
} from './dto/assessment.request';
import {
  CreateAssessmentResponse,
  DeleteAssessmentResponse,
  GetAssessmentByIdResponse,
  GetAssessmentsByInstructorResponse,
  GetAssessmentsByStudentResponse,
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
    const assessment = await this.db.query.assessments.findFirst({
      where: eq(schema.assessments.assessmentId, assessmentId),
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    const { modelId, modelConfig, ...data } = assessment;
    return data;
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
    const entries = await this.db.query.assessments.findMany({
      where: eq(schema.assessmentStudent.studentUserId, studentUserId),
      with: {
        assessmentStudent: true,
      },
    });

    const data = entries.map((assessment) => {
      const { modelId, modelConfig, assessmentStudent, ...data } = assessment;
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
