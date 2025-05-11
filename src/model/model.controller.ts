import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppResponse } from '../../dtos/app';
import { ModelService } from './model.service';

@Controller('model')
export class ModelController {
  constructor(private modelService: ModelService) {}

  @Post('system-q')
  calcualteGroupMarkBySystemQ(
    @Body() data: { peerRating: (number | null)[][]; groupScore: number },
  ): number[] | undefined {
    return this.modelService.calcualteMarkBySystemQ(
      data.peerRating,
      data.groupScore,
    );
  }
}
