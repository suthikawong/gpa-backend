import { Body, Controller, Post } from '@nestjs/common';
import { Role } from '../app.config';
import { AppResponse } from '../app.response';
import { Roles } from '../auth/decorators/roles.decorator';
import { CalcualteScoresByQASSRequest } from './dto/simulation.request';
import { SimulationService } from './simulation.service';
import { CalcualteScoresByQASSResponse } from './dto/simulation.response';

@Controller('simulation')
export class SimulationController {
  constructor(private simulationService: SimulationService) {}

  @Post('calculate-score/qass')
  @Roles([Role.Instructor])
  async calcualteScoresByQASS(
    @Body()
    data: CalcualteScoresByQASSRequest,
  ): Promise<AppResponse<CalcualteScoresByQASSResponse>> {
    const result = this.simulationService.calcualteScoresByQASS(data);
    return { data: result };
  }

  @Post('calculate-score/webavalia')
  @Roles([Role.Instructor])
  async calcualteScoresByWebavalia(
    @Body()
    data: {
      peerRating: (number | null)[][];
      groupScore: number;
      saWeight: number;
      paWeight: number;
    },
  ): Promise<AppResponse<number[] | null>> {
    const result = this.simulationService.calcualteScoresByWebavalia(
      data.peerRating,
      data.groupScore,
      data.saWeight,
      data.paWeight,
    );
    return { data: result };
  }
}
