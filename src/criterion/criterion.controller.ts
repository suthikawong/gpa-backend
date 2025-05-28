import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AppResponse } from '../app.response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

@UseGuards(JwtAuthGuard)
@Controller('criterion')
export class CriterionController {
  constructor(private readonly criterionService: CriterionService) {}

  @Post()
  async create(
    @Body() data: CreateCriterionRequest,
  ): Promise<AppResponse<CreateCriterionResponse>> {
    const criterion = await this.criterionService.create(data);
    return { data: criterion };
  }

  @Put()
  async update(
    @Body() data: UpdateCriterionRequest,
  ): Promise<AppResponse<UpdateCriterionResponse>> {
    const criterion = await this.criterionService.update(data);
    return { data: criterion };
  }

  @Delete(':criterionId')
  async delete(
    @Param() params: DeleteCriterionRequest,
  ): Promise<AppResponse<DeleteCriterionResponse>> {
    const criterion = await this.criterionService.delete(params.criterionId);
    return { data: criterion };
  }
}
