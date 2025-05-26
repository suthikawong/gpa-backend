import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { eq, ne, and } from 'drizzle-orm';
import {
  CreateCriterionRequest,
  UpdateCriterionRequest,
} from './dto/criterion.request';
import {
  CreateCriterionResponse,
  DeleteCriterionResponse,
  UpdateCriterionResponse,
} from './dto/criterion.response';
import { AssignmentService } from 'src/assignment/assignment.service';

interface ValidateCriterionInterface {
  criterionId?: schema.Criterion['criterionId'];
  criterionName: schema.Criterion['criterionName'];
  assignmentId?: schema.Criterion['assignmentId'];
}

@Injectable()
export class CriterionService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly assignmentService: AssignmentService,
  ) {}

  async getCriterionById(criterionId: schema.Criterion['criterionId']) {
    const criterion = await this.db.query.criteria.findFirst({
      where: eq(schema.criteria.criterionId, criterionId),
    });

    if (!criterion) throw new NotFoundException('Criterion not found');
    return criterion;
  }

  async create(data: CreateCriterionRequest): Promise<CreateCriterionResponse> {
    await this.validateCriterion(data);
    const [criterion] = await this.db
      .insert(schema.criteria)
      .values(data)
      .returning();
    return criterion;
  }

  async update(data: UpdateCriterionRequest): Promise<UpdateCriterionResponse> {
    const { criterionId, ...updatedDate } = data;
    await this.validateCriterion(data);

    const [criterion] = await this.db
      .update(schema.criteria)
      .set(updatedDate)
      .where(eq(schema.criteria.criterionId, criterionId))
      .returning();

    return criterion;
  }

  async delete(
    criterionId: schema.Criterion['criterionId'],
  ): Promise<DeleteCriterionResponse> {
    await this.getCriterionById(criterionId);
    await this.db
      .delete(schema.criteria)
      .where(eq(schema.criteria.criterionId, criterionId));
    return { criterionId };
  }

  async validateCriterion(data: ValidateCriterionInterface) {
    let assignmentId: schema.Criterion['assignmentId'];
    if (data?.criterionId) {
      const criterion = await this.getCriterionById(data.criterionId);
      assignmentId = criterion.assignmentId;
    } else {
      assignmentId = data.assignmentId!;
    }
    await this.assignmentService.getAssignmentById(assignmentId);
    await this.validateCriterionName(
      assignmentId,
      data.criterionName,
      data?.criterionId,
    );
  }

  async validateCriterionName(
    assignmentId: schema.Assignment['assignmentId'],
    criterionName: schema.Criterion['criterionName'],
    excludeCriterionId?: schema.Criterion['criterionId'],
  ) {
    const conditions = [
      eq(schema.criteria.criterionName, criterionName),
      eq(schema.criteria.assignmentId, assignmentId),
    ];

    if (excludeCriterionId) {
      conditions.push(ne(schema.criteria.criterionId, excludeCriterionId));
    }

    const [existing] = await this.db
      .select()
      .from(schema.criteria)
      .where(and(...conditions));

    if (existing) {
      throw new BadRequestException('Criterion name already exists.');
    }
  }
}
