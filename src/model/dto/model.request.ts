import { Transform } from 'class-transformer';
import { IsInt, IsObject, IsOptional } from 'class-validator';
import { ModelConfiguration } from '../../drizzle/schema';

export class GetModelConfigurationByIdRequest {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  modelConfigurationId: ModelConfiguration['modelConfigurationId'];
}

export class UpsertModelConfigurationRequest {
  @IsInt()
  @IsOptional()
  modelConfigurationId?: ModelConfiguration['modelConfigurationId'];

  @IsInt()
  modelId: ModelConfiguration['modelId'];

  @IsObject()
  config: {
    impact: number;
    tolerance: number;
  };
}
