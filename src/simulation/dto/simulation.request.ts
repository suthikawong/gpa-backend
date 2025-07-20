import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, ValidateNested } from 'class-validator';
import { QASSMode } from '../../utils/qass.model';

export class CalcualteScoresByQASSRequest {
  @IsArray()
  peerMatrix: number[][];

  @IsEnum(QASSMode)
  mode: QASSMode;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  groupProductScore: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  peerRatingImpact: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  groupSpread: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  tuningFactor: number;

  @IsArray()
  peerRatingWeights: number[];
}
