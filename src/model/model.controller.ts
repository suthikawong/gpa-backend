import { Body, Controller, Post } from '@nestjs/common';
import { AppResponse } from '../app.response';
import { UpsertModelConfigurationRequest } from './dto/model.request';
import { UpsertModelConfigurationResponse } from './dto/model.response';
import { ModelService } from './model.service';

@Controller('model')
export class ModelController {
  constructor(private modelService: ModelService) {}

  @Post()
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
