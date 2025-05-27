import { Model, ModelConfiguration } from '../../drizzle/schema';

export interface UpsertModelConfigurationResponse extends ModelConfiguration {}

export interface GetModelConfigurationByIdResponse extends ModelConfiguration {
  model: Model;
}
