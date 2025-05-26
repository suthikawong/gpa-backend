import { Criterion } from '../../drizzle/schema';

export interface GetCriterionByIdResponse extends Criterion {}

export interface CreateCriterionResponse extends Criterion {}

export interface UpdateCriterionResponse extends Criterion {}

export interface DeleteCriterionResponse {
  criterionId: Criterion['criterionId'];
}
