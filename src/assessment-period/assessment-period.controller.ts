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
import { AssessmentPeriodService } from './assessment-period.service';
import {
  CreateAssessmentPeriodRequest,
  CreateAssessmentQuestionRequest,
  DeleteAssessmentPeriodRequest,
  DeleteAssessmentQuestionRequest,
  GetAssessmentPeriodByIdRequest,
  UpdateAssessmentPeriodRequest,
  UpdateAssessmentQuestionRequest,
} from './dto/assessment-period.request';
import {
  CreateAssessmentPeriodResponse,
  CreateAssessmentQuestionResponse,
  DeleteAssessmentPeriodResponse,
  DeleteAssessmentQuestionResponse,
  GetAssessmentPeriodByIdResponse,
  UpdateAssessmentPeriodResponse,
  UpdateAssessmentQuestionResponse,
} from './dto/assessment-period.response';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assessment-period')
export class AssessmentPeriodController {
  constructor(
    private readonly assessmentPeriodService: AssessmentPeriodService,
  ) {}

  @Get(':assessmentPeriodId')
  @Roles([Role.Instructor])
  async getAssessmentPeriodById(
    @Param() params: GetAssessmentPeriodByIdRequest,
  ): Promise<AppResponse<GetAssessmentPeriodByIdResponse>> {
    const assessmentPeriod =
      await this.assessmentPeriodService.getAssessmentPeriodById(
        params.assessmentPeriodId,
      );
    return { data: assessmentPeriod };
  }

  @Post()
  @Roles([Role.Instructor])
  async create(
    @Body() data: CreateAssessmentPeriodRequest,
  ): Promise<AppResponse<CreateAssessmentPeriodResponse>> {
    const assessmentPeriod = await this.assessmentPeriodService.create(data);
    return { data: assessmentPeriod };
  }

  @Put()
  @Roles([Role.Instructor])
  async update(
    @Body() data: UpdateAssessmentPeriodRequest,
  ): Promise<AppResponse<UpdateAssessmentPeriodResponse>> {
    const assessmentPeriod = await this.assessmentPeriodService.update(data);
    return { data: assessmentPeriod };
  }

  @Delete(':assessmentPeriodId')
  @Roles([Role.Instructor])
  async delete(
    @Param() params: DeleteAssessmentPeriodRequest,
  ): Promise<AppResponse<DeleteAssessmentPeriodResponse>> {
    const result = await this.assessmentPeriodService.delete(
      params.assessmentPeriodId,
    );
    return { data: result };
  }

  @Post('assessment-question')
  @Roles([Role.Instructor])
  async createAssessmentQuestion(
    @Body() body: CreateAssessmentQuestionRequest,
  ): Promise<AppResponse<CreateAssessmentQuestionResponse>> {
    const question =
      await this.assessmentPeriodService.createAssessmentQuestion(body);
    return { data: question };
  }

  @Put('assessment-question')
  @Roles([Role.Instructor])
  async updateAssessmentQuestion(
    @Body() body: UpdateAssessmentQuestionRequest,
  ): Promise<AppResponse<UpdateAssessmentQuestionResponse>> {
    const question =
      await this.assessmentPeriodService.updateAssessmentQuestion(body);
    return { data: question };
  }

  @Delete('assessment-question/:questionId')
  @Roles([Role.Instructor])
  async deleteAssessmentQuestion(
    @Param() params: DeleteAssessmentQuestionRequest,
  ): Promise<AppResponse<DeleteAssessmentQuestionResponse>> {
    const result = await this.assessmentPeriodService.deleteAssessmentQuestion(
      params.questionId,
    );
    return { data: result };
  }
}
