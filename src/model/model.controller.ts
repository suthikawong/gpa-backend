import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AppResponse } from '../app.response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  GetModelConfigurationByIdRequest,
  UpsertModelConfigurationRequest,
} from './dto/model.request';
import {
  GetModelConfigurationByIdResponse,
  UpsertModelConfigurationResponse,
} from './dto/model.response';
import { ModelService } from './model.service';

@Controller('model')
export class ModelController {
  constructor(private modelService: ModelService) {}

  @Get(':modelConfigurationId')
  @UseGuards(JwtAuthGuard)
  async getAssignmentById(
    @Param() params: GetModelConfigurationByIdRequest,
  ): Promise<AppResponse<GetModelConfigurationByIdResponse>> {
    const data = await this.modelService.getModelConfigurationById(
      params.modelConfigurationId,
    );
    return { data };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async upsert(
    @Body() data: UpsertModelConfigurationRequest,
  ): Promise<AppResponse<UpsertModelConfigurationResponse>> {
    const config = await this.modelService.upsert(data);
    return { data: config };
  }

  @Post('system-q')
  calcualteGroupMarkBySystemQ(
    @Body() data: { peerRating: (number | null)[][]; groupScore: number },
  ): number[] | null {
    return this.modelService.calcualteMarksBySystemQ(
      data.peerRating,
      data.groupScore,
    );
  }

  @Post('webavalia')
  calcualteGroupMarkByWebavalia(
    @Body()
    data: {
      peerRating: (number | null)[][];
      groupScore: number;
      saWeight: number;
      paWeight: number;
    },
  ): number[] | null {
    return this.modelService.calcualteMarksByWebavalia(
      data.peerRating,
      data.groupScore,
      data.saWeight,
      data.paWeight,
    );
  }
}
