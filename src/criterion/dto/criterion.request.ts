import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsString } from 'class-validator';
import { Criterion } from '../../drizzle/schema';

export class GetCriterionByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  criterionId: Criterion['criterionId'];
}

export class CreateCriterionRequest {
  @IsString()
  criterionName: Criterion['criterionName'];

  @IsInt()
  assignmentId: Criterion['assignmentId'];

  @IsInt()
  percentage: Criterion['percentage'];

  @IsInt()
  displayOrder: Criterion['displayOrder'];
}

export class UpdateCriterionRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  criterionId: Criterion['criterionId'];

  @IsString()
  criterionName: Criterion['criterionName'];

  @IsNumber()
  percentage: Criterion['percentage'];

  @IsNumber()
  displayOrder: Criterion['displayOrder'];
}

export class DeleteCriterionRequest {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  criterionId: Criterion['criterionId'];
}
