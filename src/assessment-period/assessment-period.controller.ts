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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AppResponse } from '../app.response';
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

@UseGuards(JwtAuthGuard)
@Controller('assessment-period')
export class AssessmentPeriodController {
  constructor(
    private readonly assessmentPeriodService: AssessmentPeriodService,
  ) {}

  @Get(':assessmentPeriodId')
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
  async create(
    @Body() data: CreateAssessmentPeriodRequest,
  ): Promise<AppResponse<CreateAssessmentPeriodResponse>> {
    const assessmentPeriod = await this.assessmentPeriodService.create(data);
    return { data: assessmentPeriod };
  }

  @Put()
  async update(
    @Body() data: UpdateAssessmentPeriodRequest,
  ): Promise<AppResponse<UpdateAssessmentPeriodResponse>> {
    const assessmentPeriod = await this.assessmentPeriodService.update(data);
    return { data: assessmentPeriod };
  }

  @Delete(':assessmentPeriodId')
  async delete(
    @Param() params: DeleteAssessmentPeriodRequest,
  ): Promise<AppResponse<DeleteAssessmentPeriodResponse>> {
    const result = await this.assessmentPeriodService.delete(
      params.assessmentPeriodId,
    );
    return { data: result };
  }

  @Post('assessment-question')
  async createAssessmentQuestion(
    @Body() body: CreateAssessmentQuestionRequest,
  ): Promise<AppResponse<CreateAssessmentQuestionResponse>> {
    const question =
      await this.assessmentPeriodService.createAssessmentQuestion(body);
    return { data: question };
  }

  @Put('assessment-question')
  async updateAssessmentQuestion(
    @Body() body: UpdateAssessmentQuestionRequest,
  ): Promise<AppResponse<UpdateAssessmentQuestionResponse>> {
    const question =
      await this.assessmentPeriodService.updateAssessmentQuestion(body);
    return { data: question };
  }

  @Delete('assessment-question/:questionId')
  async deleteAssessmentQuestion(
    @Param() params: DeleteAssessmentQuestionRequest,
  ): Promise<AppResponse<DeleteAssessmentQuestionResponse>> {
    const result = await this.assessmentPeriodService.deleteAssessmentQuestion(
      params.questionId,
    );
    return { data: result };
  }
}
