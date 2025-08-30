import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../app.config';
import { AppResponse } from '../app.response';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateScoringComponentRequest,
  DeleteScoringComponentRequest,
  GetScoringComponentByIdRequest,
  UpdateScoringComponentRequest,
} from './dto/scoring-component.request';
import {
  CreateScoringComponentResponse,
  DeleteScoringComponentResponse,
  GetScoringComponentByIdResponse,
  UpdateScoringComponentResponse,
} from './dto/scoring-component.response';
import { ScoringComponentService } from './scoring-component.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scoring-component')
export class ScoringComponentController {
  constructor(
    private readonly scoringComponentService: ScoringComponentService,
  ) {}

  @Get(':scoringComponentId')
  @Roles([Role.Instructor])
  async getScoringComponentById(
    @Param() data: GetScoringComponentByIdRequest,
  ): Promise<AppResponse<GetScoringComponentByIdResponse>> {
    try {
      const scoringComponent =
        await this.scoringComponentService.getScoringComponentById(
          data.scoringComponentId,
        );
      return { data: scoringComponent };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post()
  @Roles([Role.Instructor])
  async createScoringComponent(
    @Body() data: CreateScoringComponentRequest,
  ): Promise<AppResponse<CreateScoringComponentResponse>> {
    try {
      const scoringComponent =
        await this.scoringComponentService.createScoringComponent(data);
      return { data: scoringComponent };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Put()
  @Roles([Role.Instructor])
  async updateScoringComponent(
    @Body() data: UpdateScoringComponentRequest,
  ): Promise<AppResponse<UpdateScoringComponentResponse>> {
    try {
      const scoringComponent =
        await this.scoringComponentService.updateScoringComponent(data);
      return { data: scoringComponent };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Delete(':scoringComponentId')
  @Roles([Role.Instructor])
  async deleteScoringComponent(
    @Param() data: DeleteScoringComponentRequest,
  ): Promise<AppResponse<DeleteScoringComponentResponse>> {
    try {
      const result = await this.scoringComponentService.deleteScoringComponent(
        data.scoringComponentId,
      );
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
