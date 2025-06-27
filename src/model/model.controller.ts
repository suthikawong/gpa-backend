import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '../app.config';
import { AppResponse } from '../app.response';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  GetModelConfigurationByIdRequest,
  UpsertModelConfigurationRequest,
} from './dto/model.request';
import {
  GetModelConfigurationByIdResponse,
  UpsertModelConfigurationResponse,
} from './dto/model.response';
import { ModelService } from './model.service';
import { QASSMode } from '../utils/qass.model';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('model')
export class ModelController {
  constructor(private modelService: ModelService) {}

  @Get(':modelConfigurationId')
  @Roles([Role.Instructor])
  async getAssignmentById(
    @Param() params: GetModelConfigurationByIdRequest,
  ): Promise<AppResponse<GetModelConfigurationByIdResponse>> {
    const data = await this.modelService.getModelConfigurationById(
      params.modelConfigurationId,
    );
    return { data };
  }

  @Post()
  @Roles([Role.Instructor])
  async upsert(
    @Body() data: UpsertModelConfigurationRequest,
  ): Promise<AppResponse<UpsertModelConfigurationResponse>> {
    const config = await this.modelService.upsert(data);
    return { data: config };
  }

  @Post('qass')
  calcualteGroupMarkByQASS(
    @Body()
    data: {
      peerMatrix: number[][];
      groupProductScore: number;
      peerRatingImpact: number;
      groupSpread: number;
      tuningFactor: number;
      peerRatingWeights: number[];
      mode: keyof typeof QASSMode;
    },
  ): number[] | null {
    try {
      return this.modelService.calcualteMarksByQASS(
        data.peerMatrix,
        data.groupProductScore,
        data.peerRatingImpact,
        data.groupSpread,
        data.tuningFactor,
        data.peerRatingWeights,
        QASSMode[data.mode],
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
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
