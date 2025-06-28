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
import { LoggedInUser } from '../auth/decorators/logged-in-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../drizzle/schema';
import { AssessmentService } from './assessment.service';
import {
  CreateAssessmentRequest,
  DeleteAssessmentRequest,
  GetAssessmentByIdRequest,
  GetAssessmentsByInstructorRequest,
  GetAssessmentsByStudentRequest,
  UpdateAssessmentRequest,
} from './dto/assessment.request';
import {
  CreateAssessmentResponse,
  DeleteAssessmentResponse,
  GetAssessmentByIdResponse,
  GetAssessmentsByInstructorResponse,
  GetAssessmentsByStudentResponse,
  UpdateAssessmentResponse,
} from './dto/assessment.response';

@UseGuards(JwtAuthGuard)
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

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

  @Get('instructor/:instructorUserId')
  @Roles([Role.Instructor])
  async getAssessmentsByInstructor(
    @Param() data: GetAssessmentsByInstructorRequest,
  ): Promise<AppResponse<GetAssessmentsByInstructorResponse>> {
    const assessments = await this.assessmentService.getAssessmentsByInstructor(
      data.instructorUserId,
    );
    return { data: assessments };
  }

  @Get('student/:studentUserId')
  @Roles([Role.Student])
  async getAssessmentsByStudent(
    @Param() data: GetAssessmentsByStudentRequest,
  ): Promise<AppResponse<GetAssessmentsByStudentResponse>> {
    const assessments = await this.assessmentService.getAssessmentsByStudent(
      data.studentUserId,
    );
    return { data: assessments };
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
}
