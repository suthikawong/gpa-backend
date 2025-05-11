import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppResponse } from '../../dtos/app';
import { ModelService } from './model.service';

@Controller('model')
export class ModelController {
  constructor(private modelService: ModelService) {}

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
