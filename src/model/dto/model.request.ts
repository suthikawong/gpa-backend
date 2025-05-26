import { IsNumber, IsObject, IsOptional } from 'class-validator';
import { ModelConfiguration } from '../../drizzle/schema';

export class UpsertModelConfigurationRequest {
  @IsNumber()
  @IsOptional()
  modelConfigurationId?: ModelConfiguration['modelConfigurationId'];

  @IsNumber()
  modelId: ModelConfiguration['modelId'];

  @IsObject()
  config: {
    impact: number;
    tolerance: number;
  };
}
