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

  @Get(':assignmentId/group/joined')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async getGroupMark(
    @Param() data: GetGroupMarkByGroupIdRequest,
  ): Promise<AppResponse<GetGroupMarkByGroupIdResponse>> {
    const result = await this.assignmentService.getGroupMark(data.groupId);
    return { data: result };
  }

  @Post('group/group-mark')
  @UseGuards(JwtAuthGuard)
  async markGroup(
    @Body() data: MarkGroupRequest,
  ): Promise<AppResponse<MarkGroupResponse>> {
    const result = await this.assignmentService.markGroup(data);
    return { data: result };
  }

  @Get('group/:groupId/student-marks')
  @UseGuards(JwtAuthGuard)
  async getStudnetMark(
    @Param() params: GetStudentMarksByGroupIdRequest,
  ): Promise<AppResponse<GetStudentMarksByGroupIdResponse>> {
    const result = await this.assignmentService.getStudnetMark(params.groupId);
    return { data: result };
  }

  @Post('group/student-marks')
  @UseGuards(JwtAuthGuard)
  async upsertStudentMarks(
    @Body() data: UpsertStudentMarksRequest,
  ): Promise<AppResponse<UpsertStudentMarksResponse>> {
    const result = await this.assignmentService.upsertStudentMarks(data);
    return { data: result };
  }

  @Get(':assignmentId/export')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
