import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ne, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssessmentService } from '../assessment/assessment.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import {
  CreateScoringComponentRequest,
  UpdateScoringComponentRequest,
} from './dto/scoring-component.request';
import {
  CreateScoringComponentResponse,
  DeleteScoringComponentResponse,
  GetScoringComponentByIdResponse,
  UpdateScoringComponentResponse,
} from './dto/scoring-component.response';

interface ValidateScoringComponentInterface {
  scoringComponentId?: schema.ScoringComponent['scoringComponentId'];
  startDate: schema.ScoringComponent['startDate'];
  endDate: schema.ScoringComponent['endDate'];
  assessmentId?: schema.ScoringComponent['assessmentId'];
}

@Injectable()
export class ScoringComponentService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly assignmentService: AssessmentService,
  ) {}

  async getScoringComponentById(
    scoringComponentId: schema.ScoringComponent['scoringComponentId'],
  ): Promise<GetScoringComponentByIdResponse> {
    const [scoringComponent] = await this.db
      .select()
      .from(schema.scoringComponents)
      .where(
        eq(schema.scoringComponents.scoringComponentId, scoringComponentId),
      );

    if (!scoringComponent)
      throw new NotFoundException('Scoring component not found');

    return scoringComponent;
  }

  async createScoringComponent(
    data: CreateScoringComponentRequest,
  ): Promise<CreateScoringComponentResponse> {
    await this.validateScoringComponent(data);

    const [scoringComponent] = await this.db
      .insert(schema.scoringComponents)
      .values({
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        createdDate: new Date(),
      })
      .returning();
    return scoringComponent;
  }

  async updateScoringComponent(
    data: UpdateScoringComponentRequest,
  ): Promise<UpdateScoringComponentResponse> {
    const { scoringComponentId, ...updatedData } = data;
    await this.validateScoringComponent(data);

    const [scoringComponent] = await this.db
      .update(schema.scoringComponents)
      .set({
        ...updatedData,
        startDate: new Date(updatedData.startDate),
        endDate: new Date(updatedData.endDate),
      })
      .where(
        eq(schema.scoringComponents.scoringComponentId, scoringComponentId),
      )
      .returning();

    return scoringComponent;
  }

  async deleteScoringComponent(
    scoringComponentId: schema.ScoringComponent['scoringComponentId'],
  ): Promise<DeleteScoringComponentResponse> {
    await this.getScoringComponentById(scoringComponentId);

    await this.db
      .delete(schema.scoringComponents)
      .where(
        eq(schema.scoringComponents.scoringComponentId, scoringComponentId),
      );

    return { scoringComponentId };
  }

  async validateScoringComponent(data: ValidateScoringComponentInterface) {
    let assessmentId: schema.ScoringComponent['assessmentId'];
    if (data?.scoringComponentId) {
      const scoringComponent = await this.getScoringComponentById(
        data.scoringComponentId,
      );
      assessmentId = scoringComponent.assessmentId;
    } else {
      assessmentId = data.assessmentId!;
    }
    await this.assignmentService.getAssessmentById(assessmentId);
    await this.validateOverlapAssessDates(
      assessmentId,
      data.startDate,
      data.endDate,
      data?.scoringComponentId,
    );
  }

  async validateOverlapAssessDates(
    assessmentId: schema.ScoringComponent['assessmentId'],
    startDate: schema.ScoringComponent['startDate'],
    endDate: schema.ScoringComponent['endDate'],
    excludeScoringComponentId?: schema.ScoringComponent['scoringComponentId'],
  ) {
    const conditions = [
      sql`(${schema.scoringComponents.startDate} <= ${endDate} AND ${schema.scoringComponents.endDate} >= ${startDate})`,
      eq(schema.scoringComponents.assessmentId, assessmentId),
    ];

    if (excludeScoringComponentId) {
      conditions.push(
        ne(
          schema.scoringComponents.scoringComponentId,
          excludeScoringComponentId,
        ),
      );
    }

    const overlapping = await this.db
      .select()
      .from(schema.scoringComponents)
      .where(and(...conditions));

    if (overlapping.length > 0) {
      throw new BadRequestException(
        'Scoring component dates overlap with existing components.',
      );
    }
  }

  checkScoringComponentPermission = async (
    user: schema.User,
    scoringComponentId: schema.ScoringComponent['scoringComponentId'],
  ) => {
    const [result] = await this.db
      .select()
      .from(schema.scoringComponents)
      .innerJoin(
        schema.assessments,
        eq(
          schema.assessments.assessmentId,
          schema.scoringComponents.assessmentId,
        ),
      )
      .where(
        and(
          eq(schema.scoringComponents.scoringComponentId, scoringComponentId),
          eq(schema.assessments.instructorUserId, user.userId),
        ),
      );
    if (result) return;
    throw new ForbiddenException(
      "You don't have permission to access this component",
    );
  };
}
