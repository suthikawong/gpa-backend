import { Body, Controller, Post } from '@nestjs/common';
import { Role } from '../app.config';
import { AppResponse } from '../app.response';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CalcualteScoresByQASSRequest,
  CalcualteScoresByWebavaliaRequest,
} from './dto/simulation.request';
import {
  CalcualteScoresByQASSResponse,
  CalcualteScoresByWebavaliaResponse,
} from './dto/simulation.response';
import { SimulationService } from './simulation.service';

@Controller('simulation')
export class SimulationController {
  constructor(private simulationService: SimulationService) {}

  @Post('qass')
  @Roles([Role.Instructor])
  async calcualteScoresByQASS(
    @Body()
    data: CalcualteScoresByQASSRequest,
  ): Promise<AppResponse<CalcualteScoresByQASSResponse>> {
    const result = this.simulationService.calcualteScoresByQASS(data);
    return { data: result };
  }

  @Post('webavalia')
  @Roles([Role.Instructor])
  async calcualteScoresByWebavalia(
    @Body()
    data: CalcualteScoresByWebavaliaRequest,
  ): Promise<AppResponse<CalcualteScoresByWebavaliaResponse>> {
    const result = this.simulationService.calcualteScoresByWebavalia(data);
    return { data: result };
  }
}
