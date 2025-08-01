import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsNumber } from 'class-validator';
import { QASSMode } from '../../utils/qass.model';

export class CalcualteScoresByQASSRequest {
  @IsArray()
  peerMatrix: (number | undefined)[][];

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
  polishingFactor: number;

  @IsArray()
  peerRatingWeights: number[];
}

export class CalcualteScoresByWebavaliaRequest {
  @IsArray()
  peerMatrix: (number | undefined)[][];

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  groupGrade: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  selfWeight: number;
}
