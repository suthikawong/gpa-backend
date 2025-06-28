import { ScoringComponent } from '../../drizzle/schema';

export interface GetScoringComponentByIdResponse extends ScoringComponent {}

export interface CreateScoringComponentResponse extends ScoringComponent {}

export interface UpdateScoringComponentResponse extends ScoringComponent {}

export type DeleteScoringComponentResponse = Pick<
  ScoringComponent,
  'scoringComponentId'
>;
