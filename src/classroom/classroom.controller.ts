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
import { ClassroomService } from './classroom.service';
import {
  CreateClassroomRequest,
  DeleteClassroomRequest,
  GetAssignmentsByClassroomIdRequest,
  GetClassroomByIdRequest,
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classroom')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Get('instructor')
  @Roles([Role.Instructor])
  async getByInstructor(
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetClassroomsByInstructorResponse>> {
    console.log(user);
    const classrooms = await this.classroomService.getClassroomsByInstructor(
      user.userId,
    );
    return { data: classrooms };
  }

  @Get('student')
  @Roles([Role.Student])
  async getByStudent(
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetClassroomsByStudentResponse>> {
    const classrooms = await this.classroomService.getByStudentId(user.userId);
    return { data: classrooms };
  }

  @Get(':classroomId')
  async getById(
    @Param() data: GetClassroomByIdRequest,
  ): Promise<AppResponse<GetClassroomByIdResponse>> {
    const classroom = await this.classroomService.getClassroomById(
      data.classroomId,
    );
    return { data: classroom };
  }

  @Post()
  @Roles([Role.Instructor])
  async create(
    @Body() data: CreateClassroomRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<CreateClassroomResponse>> {
    const classroom = await this.classroomService.create(data, user.userId);
    return { data: classroom };
  }

  @Put()
  @Roles([Role.Instructor])
  async update(
    @Body() data: UpdateClassroomRequest,
  ): Promise<AppResponse<UpdateClassroomResponse>> {
    const classroom = await this.classroomService.update(data);
    return { data: classroom };
  }

  @Delete(':classroomId')
  @Roles([Role.Instructor])
  async delete(
    @Param() params: DeleteClassroomRequest,
  ): Promise<AppResponse<DeleteClassroomResponse>> {
    const result = await this.classroomService.delete(params.classroomId);
    return { data: result };
  }

  @Get('student/search')
  @Roles([Role.Instructor])
  async searchStudentsInClassroom(
    @Query() query: SearchStudentsInClassroomRequest,
  ): Promise<AppResponse<SearchStudentsInClassroomResponse>> {
    const result = await this.classroomService.searchStudentsInClassroom(query);
    return { data: result.students, total: result.total };
  }

  @Delete(':classroomId/student/:studentUserId')
  @Roles([Role.Instructor])
  async removeStudentFromClassroom(
    @Param() params: RemoveStudentFromClassroomRequest,
  ): Promise<AppResponse<RemoveStudentFromClassroomResponse>> {
    const result = await this.classroomService.removeStudentFromClassroom(
      params.classroomId,
      params.studentUserId,
    );
    return { data: result };
  }

  @Get(':classroomId/assignments')
  async getAssignmentsByClassroomId(
    @Param() params: GetAssignmentsByClassroomIdRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetAssignmentsByClassroomIdResponse>> {
    const data = await this.classroomService.getAssignmentsByClassroomId(
      params.classroomId,
      user.roleId,
    );
    return { data };
  }

  @Post('join')
  @Roles([Role.Student])
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
