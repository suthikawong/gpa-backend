import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../app.config';
import { AppResponse } from '../app.response';
import { LoggedInUser } from '../auth/decorators/logged-in-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../drizzle/schema';
import { AssessmentService } from './assessment.service';
import {
  CheckScoringComponentActiveRequest,
  ConfirmStudentJoinAssessmentRequest,
  CreateAssessmentRequest,
  DeleteAssessmentRequest,
  GetAssessmentByIdRequest,
  GetGroupsByAssessmentIdRequest,
  GetMyScoreRequest,
  GetScoringComponentsByAssessmentIdRequest,
  GetStudentJoinedGroupRequest,
  RemoveStudentFromAssessmentRequest,
  SearchStudentsInAssessmentRequest,
  StudentJoinAssessmentRequest,
  UpdateAssessmentRequest,
} from './dto/assessment.request';
import {
  CheckScoringComponentActiveResponse,
  ConfirmStudentJoinAssessmentResponse,
  CreateAssessmentResponse,
  DeleteAssessmentResponse,
  GetAssessmentByIdResponse,
  GetAssessmentsByInstructorResponse,
  GetAssessmentsByStudentResponse,
  GetGroupsByAssessmentIdResponse,
  GetMyScoreResponse,
  GetScoringComponentsByAssessmentIdResponse,
  GetStudentJoinedGroupResponse,
  RemoveStudentFromAssessmentResponse,
  SearchStudentsInAssessmentResponse,
  StudentJoinAssessmentResponse,
  UpdateAssessmentResponse,
} from './dto/assessment.response';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Get('student/search')
  @Roles([Role.Instructor])
  async searchStudentsInAssessment(
    @Query() query: SearchStudentsInAssessmentRequest,
  ): Promise<AppResponse<SearchStudentsInAssessmentResponse>> {
    const result =
      await this.assessmentService.searchStudentsInAssessment(query);
    return { data: result.students, total: result.total };
  }

  @Get('instructor')
  @Roles([Role.Instructor])
  async getAssessmentsByInstructor(
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetAssessmentsByInstructorResponse>> {
    const assessments = await this.assessmentService.getAssessmentsByInstructor(
      user.userId,
    );
    return { data: assessments };
  }

  @Get('student')
  @Roles([Role.Student])
  async getAssessmentsByStudent(
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetAssessmentsByStudentResponse>> {
    const assessments = await this.assessmentService.getAssessmentsByStudent(
      user.userId,
    );
    return { data: assessments };
  }

  @Get(':assessmentId')
  @Roles([Role.Instructor, Role.Student])
  async getAssessmentById(
    @Param() data: GetAssessmentByIdRequest,
  ): Promise<AppResponse<GetAssessmentByIdResponse>> {
    const assessment = await this.assessmentService.getAssessmentById(
      data.assessmentId,
    );
    return { data: assessment };
  }

  @Post()
  @Roles([Role.Instructor])
  async createAssessment(
    @Body() data: CreateAssessmentRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<CreateAssessmentResponse>> {
    const assessment = await this.assessmentService.createAssessment(
      data,
      user.userId,
    );
    return { data: assessment };
  }

  @Put()
  @Roles([Role.Instructor])
  async updateAssessment(
    @Body() data: UpdateAssessmentRequest,
  ): Promise<AppResponse<UpdateAssessmentResponse>> {
    const assessment = await this.assessmentService.updateAssessment(data);
    return { data: assessment };
  }

  @Delete(':assessmentId')
  @Roles([Role.Instructor])
  async deleteAssessment(
    @Param() data: DeleteAssessmentRequest,
  ): Promise<AppResponse<DeleteAssessmentResponse>> {
    const result = await this.assessmentService.deleteAssessment(data);
    return { data: result };
  }

  @Post('join')
  @Roles([Role.Student])
  async studentJoinAssessment(
    @Body() data: StudentJoinAssessmentRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<StudentJoinAssessmentResponse>> {
    const result = await this.assessmentService.studentJoinAssessment(
      data,
      user.userId,
    );
    return { data: result };
  }

  @Post('confirm')
  @Roles([Role.Instructor])
  async confirmStudentJoinAssessment(
    @Body() data: ConfirmStudentJoinAssessmentRequest,
  ): Promise<AppResponse<ConfirmStudentJoinAssessmentResponse>> {
    const result =
      await this.assessmentService.confirmStudentJoinAssessment(data);
    return { data: result };
  }

  @Delete(':assessmentId/student/:studentUserId')
  @Roles([Role.Instructor])
  async removeStudentFromAssessment(
    @Param() data: RemoveStudentFromAssessmentRequest,
  ): Promise<AppResponse<RemoveStudentFromAssessmentResponse>> {
    const result =
      await this.assessmentService.removeStudentFromAssessment(data);
    return { data: result };
  }

  @Get(':assessmentId/scoring-components')
  @Roles([Role.Instructor])
  async getScoringComponentsByAssessmentId(
    @Param() data: GetScoringComponentsByAssessmentIdRequest,
  ): Promise<AppResponse<GetScoringComponentsByAssessmentIdResponse>> {
    const scoringComponents =
      await this.assessmentService.getScoringComponentsByAssessmentId(data);
    return { data: scoringComponents };
  }

  @Get(':assessmentId/group/joined')
  @Roles([Role.Student])
  async getJoinedGroup(
    @Param() param: GetStudentJoinedGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetStudentJoinedGroupResponse>> {
    const group = await this.assessmentService.getStudentJoinedGroup(
      param.assessmentId,
      user.userId,
    );
    return { data: group };
  }

  @Get(':assessmentId/groups')
  @Roles([Role.Instructor])
  async getGroupsByAssessmentId(
    @Param() data: GetGroupsByAssessmentIdRequest,
  ): Promise<AppResponse<GetGroupsByAssessmentIdResponse>> {
    const groups = await this.assessmentService.getGroupsByAssessmentId(data);
    return { data: groups };
  }

  @Get(':assessmentId/my-score')
  async getMyScore(
    @Param() params: GetMyScoreRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetMyScoreResponse>> {
    const data = await this.assessmentService.getMyScore(
      params.assessmentId,
      user.userId,
    );
    return { data };
  }

  @Get(':assessmentId/scoring-component/check')
  async checkScoringComponentActive(
    @Param() params: CheckScoringComponentActiveRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<CheckScoringComponentActiveResponse>> {
    const data = await this.assessmentService.checkScoringComponentActive(
      params,
      user.userId,
    );
    return { data };
  }
}
