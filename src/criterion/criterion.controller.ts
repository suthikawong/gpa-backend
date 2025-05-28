import {
  Body,
  Controller,
  Delete,
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
import { CriterionService } from './criterion.service';
import {
  CreateCriterionRequest,
  DeleteCriterionRequest,
  UpdateCriterionRequest,
} from './dto/criterion.request';
import {
  CreateCriterionResponse,
  DeleteCriterionResponse,
  UpdateCriterionResponse,
} from './dto/criterion.response';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('criterion')
export class CriterionController {
  constructor(private readonly criterionService: CriterionService) {}

  @Post()
  @Roles([Role.Instructor])
  async create(
    @Body() data: CreateCriterionRequest,
  ): Promise<AppResponse<CreateCriterionResponse>> {
    const criterion = await this.criterionService.create(data);
    return { data: criterion };
  }

  @Put()
  @Roles([Role.Instructor])
  async update(
    @Body() data: UpdateCriterionRequest,
  ): Promise<AppResponse<UpdateCriterionResponse>> {
    const criterion = await this.criterionService.update(data);
    return { data: criterion };
  }

  @Delete(':criterionId')
  @Roles([Role.Instructor])
  async delete(
    @Param() params: DeleteCriterionRequest,
  ): Promise<AppResponse<DeleteCriterionResponse>> {
    const criterion = await this.criterionService.delete(params.criterionId);
    return { data: criterion };
  }
}
