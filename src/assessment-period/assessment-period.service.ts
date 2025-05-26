import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ne, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssignmentService } from '../assignment/assignment.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import {
  CreateAssessmentPeriodRequest,
  CreateAssessmentQuestionRequest,
  UpdateAssessmentPeriodRequest,
  UpdateAssessmentQuestionRequest,
} from './dto/assessment-period.request';
import {
  CreateAssessmentPeriodResponse,
  CreateAssessmentQuestionResponse,
  DeleteAssessmentPeriodResponse,
  DeleteAssessmentQuestionResponse,
  GetAssessmentPeriodByIdResponse,
  UpdateAssessmentPeriodResponse,
  UpdateAssessmentQuestionResponse,
} from './dto/assessment-period.response';

interface ValidateAssessmentPeriodInterface {
  assessmentPeriodId?: schema.AssessmentPeriod['assessmentPeriodId'];
  assessStartDate: schema.AssessmentPeriod['assessStartDate'];
  assessEndDate: schema.AssessmentPeriod['assessEndDate'];
  assignmentId?: schema.AssessmentPeriod['assignmentId'];
}

interface ValidateAssessmentQuestionInterface {
  questionId?: schema.Question['questionId'];
  question: schema.Question['question'];
  assessmentPeriodId?: schema.Question['assessmentPeriodId'];
}

@Injectable()
export class AssessmentPeriodService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly assignmentService: AssignmentService,
  ) {}

  async getAssessmentPeriodById(
    assessmentPeriodId: schema.AssessmentPeriod['assessmentPeriodId'],
  ): Promise<GetAssessmentPeriodByIdResponse> {
    const [assessmentPeriod] = await this.db
      .select()
      .from(schema.assessmentPeriods)
      .where(
        eq(schema.assessmentPeriods.assessmentPeriodId, assessmentPeriodId),
      );

    if (!assessmentPeriod)
      throw new NotFoundException('Assessment period not found');

    const questionList = await this.db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.assessmentPeriodId, assessmentPeriodId));

    return {
      ...assessmentPeriod,
      questions: questionList,
    };
  }

  async create(
    data: CreateAssessmentPeriodRequest,
  ): Promise<CreateAssessmentPeriodResponse> {
    await this.validateAssessmentPeriod(data);

    const [assessmentPeriod] = await this.db
      .insert(schema.assessmentPeriods)
      .values({
        ...data,
        assessStartDate: new Date(data.assessStartDate),
        assessEndDate: new Date(data.assessEndDate),
      })
      .returning();
    return assessmentPeriod;
  }

  async update(
    data: UpdateAssessmentPeriodRequest,
  ): Promise<UpdateAssessmentPeriodResponse> {
    const { assessmentPeriodId, ...updatedData } = data;
    await this.validateAssessmentPeriod(data);

    const [assessmentPeriod] = await this.db
      .update(schema.assessmentPeriods)
      .set({
        ...updatedData,
        assessStartDate: new Date(updatedData.assessStartDate),
        assessEndDate: new Date(updatedData.assessEndDate),
      })
      .where(
        eq(schema.assessmentPeriods.assessmentPeriodId, assessmentPeriodId),
      )
      .returning();

    return assessmentPeriod;
  }

  async delete(
    assessmentPeriodId: schema.AssessmentPeriod['assessmentPeriodId'],
  ): Promise<DeleteAssessmentPeriodResponse> {
    await this.getAssessmentPeriodById(assessmentPeriodId);

    await this.db
      .delete(schema.assessmentPeriods)
      .where(
        eq(schema.assessmentPeriods.assessmentPeriodId, assessmentPeriodId),
      );

    return { assessmentPeriodId };
  }

  async getQuestionById(
    questionId: schema.Question['questionId'],
  ): Promise<schema.Question> {
    const question = await this.db.query.questions.findFirst({
      where: eq(schema.questions.questionId, questionId),
    });
    if (!question) {
      throw new NotFoundException(`Question not found`);
    }
    return question;
  }

  async createAssessmentQuestion(
    data: CreateAssessmentQuestionRequest,
  ): Promise<CreateAssessmentQuestionResponse> {
    await this.validateAssessmentQuestion(data);
    const [question] = await this.db
      .insert(schema.questions)
      .values(data)
      .returning();
    return question;
  }

  async updateAssessmentQuestion(
    data: UpdateAssessmentQuestionRequest,
  ): Promise<UpdateAssessmentQuestionResponse> {
    const { questionId, ...updatedData } = data;
    await this.validateAssessmentQuestion(data);

    const [question] = await this.db
      .update(schema.questions)
      .set(updatedData)
      .where(eq(schema.questions.questionId, questionId))
      .returning();

    return question;
  }

  async deleteAssessmentQuestion(
    questionId: schema.Question['questionId'],
  ): Promise<DeleteAssessmentQuestionResponse> {
    await this.getQuestionById(questionId);
    await this.db
      .delete(schema.questions)
      .where(eq(schema.questions.questionId, questionId));
    return { questionId };
  }

  async validateAssessmentPeriod(data: ValidateAssessmentPeriodInterface) {
    let assignmentId: schema.AssessmentPeriod['assignmentId'];
    if (data?.assessmentPeriodId) {
      const assessmentPeriod = await this.getAssessmentPeriodById(
        data.assessmentPeriodId,
      );
      assignmentId = assessmentPeriod.assignmentId;
    } else {
      assignmentId = data.assignmentId!;
    }
    await this.assignmentService.getAssignmentById(assignmentId);
    await this.validateOverlapAssessDates(
      assignmentId,
      data.assessStartDate,
      data.assessEndDate,
      data?.assessmentPeriodId,
    );
  }

  async validateOverlapAssessDates(
    assignmentId: schema.AssessmentPeriod['assignmentId'],
    assessStartDate: schema.AssessmentPeriod['assessStartDate'],
    assessEndDate: schema.AssessmentPeriod['assessEndDate'],
    excludeAssessmentPeriodId?: schema.AssessmentPeriod['assessmentPeriodId'],
  ) {
    const conditions = [
      sql`(${schema.assessmentPeriods.assessStartDate} <= ${assessEndDate} AND ${schema.assessmentPeriods.assessEndDate} >= ${assessStartDate})`,
      eq(schema.assessmentPeriods.assignmentId, assignmentId),
    ];

    if (excludeAssessmentPeriodId) {
      conditions.push(
        ne(
          schema.assessmentPeriods.assessmentPeriodId,
          excludeAssessmentPeriodId,
        ),
      );
    }

    const overlapping = await this.db
      .select()
      .from(schema.assessmentPeriods)
      .where(and(...conditions));

    if (overlapping.length > 0) {
      throw new BadRequestException(
        'Assessment period dates overlap with existing periods.',
      );
    }
  }

  async validateAssessmentQuestion(data: ValidateAssessmentQuestionInterface) {
    let assessmentPeriodId: schema.Question['assessmentPeriodId'];
    if (data?.questionId) {
      const question = await this.getQuestionById(data.questionId);
      assessmentPeriodId = question.assessmentPeriodId;
    } else {
      assessmentPeriodId = data.assessmentPeriodId!;
    }
    await this.getAssessmentPeriodById(assessmentPeriodId);
    await this.validateQuestion(
      assessmentPeriodId,
      data.question,
      data?.questionId,
    );
  }

  async validateQuestion(
    assessmentPeriodId: schema.Question['assessmentPeriodId'],
    question: schema.Question['question'],
    excludeQuestionId?: schema.Question['questionId'],
  ) {
    const conditions = [
      eq(schema.questions.question, question),
      eq(schema.questions.assessmentPeriodId, assessmentPeriodId),
    ];

    if (excludeQuestionId) {
      conditions.push(ne(schema.questions.questionId, excludeQuestionId));
    }

    const [existing] = await this.db
      .select()
      .from(schema.questions)
      .where(and(...conditions));

    if (existing) {
      throw new BadRequestException('This question already exists.');
    }
  }
}
