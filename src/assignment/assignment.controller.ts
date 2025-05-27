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
import { AppResponse } from '../app.response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignmentService } from './assignment.service';
import {
  CreateAssignmentRequest,
  DeleteAssignmentRequest,
  GetAssessmentPeriodsByAssignmentIdRequest,
  GetAssignmentByIdRequest,
  GetCriteriaByAssignmentIdRequest,
  GetGroupsByAssignmentIdRequest,
  GetMarkingProgressByAssignmentIdRequest,
  UpdateAssignmentRequest,
} from './dto/assignment.request';
import {
  CreateAssignmentResponse,
  DeleteAssignmentResponse,
  GetAssessmentPeriodsByAssignmentIdResponse,
  GetAssignmentByIdResponse,
  GetCriteriaByAssignmentIdResponse,
  GetGroupsByAssignmentIdResponse,
  GetMarkingProgressByAssignmentIdResponse,
  UpdateAssignmentResponse,
} from './dto/assignment.response';

@Controller('assignment')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get(':assignmentId')
  @UseGuards(JwtAuthGuard)
  async getAssignmentById(
    @Param() params: GetAssignmentByIdRequest,
  ): Promise<AppResponse<GetAssignmentByIdResponse>> {
    const data = await this.assignmentService.getAssignmentById(
      params.assignmentId,
    );
    return { data };
  }

  @Get(':assignmentId/groups')
  @UseGuards(JwtAuthGuard)
  async getGroupsByAssignmentId(
    @Param() params: GetGroupsByAssignmentIdRequest,
  ): Promise<AppResponse<GetGroupsByAssignmentIdResponse>> {
    const data = await this.assignmentService.getGroupsByAssignmentId(
      params.assignmentId,
    );
    return { data };
  }

  @Get(':assignmentId/criteria')
  @UseGuards(JwtAuthGuard)
  async getCriteriaByAssignmentId(
    @Param() params: GetCriteriaByAssignmentIdRequest,
  ): Promise<AppResponse<GetCriteriaByAssignmentIdResponse>> {
    const data = await this.assignmentService.getCriteriaByAssignmentId(
      params.assignmentId,
    );
    return { data };
  }

  @Get(':assignmentId/assessment-periods')
  @UseGuards(JwtAuthGuard)
  async getAssessmentPeriodsByAssignmentId(
    @Param() params: GetAssessmentPeriodsByAssignmentIdRequest,
  ): Promise<AppResponse<GetAssessmentPeriodsByAssignmentIdResponse>> {
    const data =
      await this.assignmentService.getAssessmentPeriodsByAssignmentId(
        params.assignmentId,
      );
    return { data };
  }

  @Get(':assignmentId/marking-progress')
  @UseGuards(JwtAuthGuard)
  async getMarkingProgressByAssignmentId(
    @Param() params: GetMarkingProgressByAssignmentIdRequest,
  ): Promise<AppResponse<GetMarkingProgressByAssignmentIdResponse>> {
    const data = await this.assignmentService.getMarkingProgressByAssignmentId(
      params.assignmentId,
    );
    return { data };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() data: CreateAssignmentRequest,
  ): Promise<AppResponse<CreateAssignmentResponse>> {
    const assignment = await this.assignmentService.create(data);
    return { data: assignment };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async update(
    @Body() data: UpdateAssignmentRequest,
  ): Promise<AppResponse<UpdateAssignmentResponse>> {
    const assignment = await this.assignmentService.update(data);
    return { data: assignment };
  }

  @Delete(':assignmentId')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param() params: DeleteAssignmentRequest,
  ): Promise<AppResponse<DeleteAssignmentResponse>> {
    const data = await this.assignmentService.delete(params.assignmentId);
    return { data };
  }
}
