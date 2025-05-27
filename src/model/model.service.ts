import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { systemQ } from '../utils/system-q-model';
import { webavalia } from '../utils/webavalia-model';
import { UpsertModelConfigurationRequest } from './dto/model.request';
import { GetModelConfigurationByIdResponse } from './dto/model.response';

@Injectable()
export class ModelService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getModelConfigurationById(
    modelConfigurationId: schema.ModelConfiguration['modelConfigurationId'],
  ): Promise<GetModelConfigurationByIdResponse> {
    const [result] = await this.db
      .select()
      .from(schema.modelConfigurations)
      .innerJoin(
        schema.models,
        eq(schema.modelConfigurations.modelId, schema.models.modelId),
      )
      .where(
        eq(
          schema.modelConfigurations.modelConfigurationId,
          modelConfigurationId,
        ),
      );
    if (!result) {
      throw new NotFoundException(`Model configuration not found`);
    }
    return {
      ...result.model_configurations,
      model: result.models,
    };
  }

  async upsert(data: UpsertModelConfigurationRequest) {
    // update
    if (data?.modelConfigurationId) {
      const { modelConfigurationId, ...updatedData } = data;
      await this.getModelConfigurationById(data.modelConfigurationId);

      const [config] = await this.db
        .update(schema.modelConfigurations)
        .set(updatedData)
        .where(
          eq(
            schema.modelConfigurations.modelConfigurationId,
            modelConfigurationId,
          ),
        )
        .returning();
      return config;
    }
    // create
    else {
      const [config] = await this.db
        .insert(schema.modelConfigurations)
        .values({
          modelId: data.modelId,
          config: data.config,
        })
        .returning();
      return config;
    }
  }

  calcualteMarksBySystemQ = (
    peerRating: (number | null)[][],
    groupScore: number,
  ): number[] | null => {
    return systemQ(peerRating, groupScore);
  };

  calcualteMarksByWebavalia = (
    peerRating: (number | null)[][],
    groupScore: number,
    saWeight: number,
    paWeight: number,
  ): number[] | null => {
    return webavalia(peerRating, groupScore, saWeight, paWeight);
  };
}
