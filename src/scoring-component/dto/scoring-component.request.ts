import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsNumber } from 'class-validator';
import { ScoringComponent } from '../../drizzle/schema';

export class GetScoringComponentByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  scoringComponentId: ScoringComponent['scoringComponentId'];
}

export class CreateScoringComponentRequest {
  @IsDateString()
  startDate: ScoringComponent['startDate'];

  @IsDateString()
  endDate: ScoringComponent['endDate'];

  @IsNumber()
  weight: ScoringComponent['weight'];

  @IsInt()
  assessmentId: ScoringComponent['assessmentId'];
}

export class UpdateScoringComponentRequest {
  @IsInt()
  scoringComponentId: ScoringComponent['scoringComponentId'];

  @IsDateString()
  startDate: ScoringComponent['startDate'];

  @IsDateString()
  endDate: ScoringComponent['endDate'];

  @IsNumber()
  weight: ScoringComponent['weight'];
}

export class DeleteScoringComponentRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  scoringComponentId: ScoringComponent['scoringComponentId'];
}
