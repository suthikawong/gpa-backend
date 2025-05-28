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
import { AppResponse } from '../app.response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoggedInUser } from '../auth/logged-in-user.decorator';
import { User } from '../drizzle/schema';
import { ClassroomService } from './classroom.service';
import {
  CreateClassroomRequest,
  DeleteClassroomRequest,
  GetAssignmentsByClassroomIdRequest,
  GetClassroomByIdRequest,
  GetClassroomsByInstructorRequest,
  GetClassroomsByStudentRequest,
  JoinClassroomRequest,
  RemoveStudentFromClassroomRequest,
  SearchStudentsInClassroomRequest,
  UpdateClassroomRequest,
} from './dto/classroom.request';
import {
  CreateClassroomResponse,
  DeleteClassroomResponse,
  GetAssignmentsByClassroomIdResponse,
  GetClassroomByIdResponse,
  GetClassroomsByInstructorResponse,
  GetClassroomsByStudentResponse,
  JoinClassroomResponse,
  RemoveStudentFromClassroomResponse,
  SearchStudentsInClassroomResponse,
  UpdateClassroomResponse,
} from './dto/classroom.response';

@Controller('classroom')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Get(':classroomId')
  @UseGuards(JwtAuthGuard)
  async getById(
    @Param() data: GetClassroomByIdRequest,
  ): Promise<AppResponse<GetClassroomByIdResponse>> {
    const classroom = await this.classroomService.getClassroomById(
      data.classroomId,
    );
    return { data: classroom };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() data: CreateClassroomRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<CreateClassroomResponse>> {
    const classroom = await this.classroomService.create(data, user.userId);
    return { data: classroom };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async update(
    @Body() data: UpdateClassroomRequest,
  ): Promise<AppResponse<UpdateClassroomResponse>> {
    const classroom = await this.classroomService.update(data);
    return { data: classroom };
  }

  @Delete(':classroomId')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param() params: DeleteClassroomRequest,
  ): Promise<AppResponse<DeleteClassroomResponse>> {
    const result = await this.classroomService.delete(params.classroomId);
    return { data: result };
  }

  @Get('student/search')
  @UseGuards(JwtAuthGuard)
  async searchStudentsInClassroom(
    @Query() query: SearchStudentsInClassroomRequest,
  ): Promise<AppResponse<SearchStudentsInClassroomResponse>> {
    const students =
      await this.classroomService.searchStudentsInClassroom(query);
    return { data: students };
  }

  @Get('instructor/:instructorUserId')
  @UseGuards(JwtAuthGuard)
  async getByInstructor(
    @Param() params: GetClassroomsByInstructorRequest,
  ): Promise<AppResponse<GetClassroomsByInstructorResponse>> {
    const classrooms = await this.classroomService.getClassroomsByInstructor(
      params.instructorUserId,
    );
    return { data: classrooms };
  }

  @Get('student/:studentUserId')
  @UseGuards(JwtAuthGuard)
  async getByStudent(
    @Param() params: GetClassroomsByStudentRequest,
  ): Promise<AppResponse<GetClassroomsByStudentResponse>> {
    const classrooms = await this.classroomService.getByStudentId(
      params.studentUserId,
    );
    return { data: classrooms };
  }

  @Delete(':classroomId/student/:studentUserId')
  @UseGuards(JwtAuthGuard)
  async removeStudentFromClassroom(
    @Param() params: RemoveStudentFromClassroomRequest,
  ): Promise<AppResponse<RemoveStudentFromClassroomResponse>> {
    const result = await this.classroomService.removeStudentFromClassroom(
      params.classroomId,
      params.studentUserId,
    );
    return { data: result };
  }

  @Get(':classroomId/assignment')
  @UseGuards(JwtAuthGuard)
  async getAssignmentsByClassroomId(
    @Param() params: GetAssignmentsByClassroomIdRequest,
  ): Promise<AppResponse<GetAssignmentsByClassroomIdResponse>> {
    const data = await this.classroomService.getAssignmentsByClassroomId(
      params.classroomId,
    );
    return { data };
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  async join(
    @Body() data: JoinClassroomRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<JoinClassroomResponse>> {
    const result = await this.classroomService.joinClassroom(
      user.userId,
      data.classroomCode,
    );
    return { data: result };
  }
}
