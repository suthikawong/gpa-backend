import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AppResponse } from '../app.response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoggedInUser } from '../auth/logged-in-user.decorator';
import { User } from '../drizzle/schema';
import { AssignmentService } from './assignment.service';
import {
  CreateAssignmentRequest,
  DeleteAssignmentRequest,
  ExportAssignmentScoresRequest,
  GetAssessmentPeriodsByAssignmentIdRequest,
  GetAssignmentByIdRequest,
  GetCriteriaByAssignmentIdRequest,
  GetGroupMarkByGroupIdRequest,
  GetGroupsByAssignmentIdRequest,
  GetJoinedGroupRequest,
  GetMarkingProgressByAssignmentIdRequest,
  GetMyMarkRequest,
  GetStudentMarksByGroupIdRequest,
  MarkGroupRequest,
  UpdateAssignmentRequest,
  UpsertStudentMarksRequest,
} from './dto/assignment.request';
import {
  CreateAssignmentResponse,
  DeleteAssignmentResponse,
  GetAssessmentPeriodsByAssignmentIdResponse,
  GetAssignmentByIdResponse,
  GetCriteriaByAssignmentIdResponse,
  GetGroupMarkByGroupIdResponse,
  GetGroupsByAssignmentIdResponse,
  GetJoinedGroupResponse,
  GetMarkingProgressByAssignmentIdResponse,
  GetMyMarkResponse,
  GetStudentMarksByGroupIdResponse,
  MarkGroupResponse,
  UpdateAssignmentResponse,
  UpsertStudentMarksResponse,
} from './dto/assignment.response';

@UseGuards(JwtAuthGuard)
@Controller('assignment')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get(':assignmentId')
  async getAssignmentById(
    @Param() params: GetAssignmentByIdRequest,
  ): Promise<AppResponse<GetAssignmentByIdResponse>> {
    const data = await this.assignmentService.getAssignmentById(
      params.assignmentId,
    );
    return { data };
  }

  @Get(':assignmentId/groups')
  async getGroupsByAssignmentId(
    @Param() params: GetGroupsByAssignmentIdRequest,
  ): Promise<AppResponse<GetGroupsByAssignmentIdResponse>> {
    const data = await this.assignmentService.getGroupsByAssignmentId(
      params.assignmentId,
    );
    return { data };
  }

  @Get(':assignmentId/criteria')
  async getCriteriaByAssignmentId(
    @Param() params: GetCriteriaByAssignmentIdRequest,
  ): Promise<AppResponse<GetCriteriaByAssignmentIdResponse>> {
    const data = await this.assignmentService.getCriteriaByAssignmentId(
      params.assignmentId,
    );
    return { data };
  }

  @Get(':assignmentId/assessment-periods')
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
  async getMarkingProgressByAssignmentId(
    @Param() params: GetMarkingProgressByAssignmentIdRequest,
  ): Promise<AppResponse<GetMarkingProgressByAssignmentIdResponse>> {
    const data = await this.assignmentService.getMarkingProgressByAssignmentId(
      params.assignmentId,
    );
    return { data };
  }

  @Post()
  async create(
    @Body() data: CreateAssignmentRequest,
  ): Promise<AppResponse<CreateAssignmentResponse>> {
    const assignment = await this.assignmentService.create(data);
    return { data: assignment };
  }

  @Put()
  async update(
    @Body() data: UpdateAssignmentRequest,
  ): Promise<AppResponse<UpdateAssignmentResponse>> {
    const assignment = await this.assignmentService.update(data);
    return { data: assignment };
  }

  @Delete(':assignmentId')
  async delete(
    @Param() params: DeleteAssignmentRequest,
  ): Promise<AppResponse<DeleteAssignmentResponse>> {
    const data = await this.assignmentService.delete(params.assignmentId);
    return { data };
  }

  @Get(':assignmentId/group/joined')
  async getJoinedGroup(
    @Param() params: GetJoinedGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetJoinedGroupResponse>> {
    const result = await this.assignmentService.getJoinedGroup(
      user.userId,
      params.assignmentId,
    );
    return { data: result };
  }

  @Get('group/:groupId/group-mark')
  async getGroupMark(
    @Param() data: GetGroupMarkByGroupIdRequest,
  ): Promise<AppResponse<GetGroupMarkByGroupIdResponse>> {
    const result = await this.assignmentService.getGroupMark(data.groupId);
    return { data: result };
  }

  @Post('group/group-mark')
  async markGroup(
    @Body() data: MarkGroupRequest,
  ): Promise<AppResponse<MarkGroupResponse>> {
    const result = await this.assignmentService.markGroup(data);
    return { data: result };
  }

  @Get('group/:groupId/student-marks')
  async getStudnetMark(
    @Param() params: GetStudentMarksByGroupIdRequest,
  ): Promise<AppResponse<GetStudentMarksByGroupIdResponse>> {
    const result = await this.assignmentService.getStudnetMark(params.groupId);
    return { data: result };
  }

  @Post('group/student-marks')
  async upsertStudentMarks(
    @Body() data: UpsertStudentMarksRequest,
  ): Promise<AppResponse<UpsertStudentMarksResponse>> {
    const result = await this.assignmentService.upsertStudentMarks(data);
    return { data: result };
  }

  @Get(':assignmentId/export')
  async exportAssignmentScores(
    @Param() params: ExportAssignmentScoresRequest,
    @Res() res: Response,
  ) {
    const result = await this.assignmentService.exportAssignmentScores(
      params.assignmentId,
    );

    res.header(
      'Content-Disposition',
      `attachment; filename=${result.filename}`,
    );
    res.type(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(result.buffer);
  }

  @Get(':assignmentId/my-mark')
  async getMyMark(
    @Param() params: GetMyMarkRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetMyMarkResponse>> {
    const result = await this.assignmentService.getMyMark(
      params.assignmentId,
      user.userId,
    );
    return { data: result };
  }
}
