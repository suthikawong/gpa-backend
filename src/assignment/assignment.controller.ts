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
  GetAssignmentByIdRequest,
  UpdateAssignmentRequest,
} from './dto/assignment.request';
import {
  CreateAssignmentResponse,
  DeleteAssignmentResponse,
  GetAssignmentByIdResponse,
  UpdateAssignmentResponse,
} from './dto/assignment.response';

@Controller('assignment')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get(':assignmentId')
  @UseGuards(JwtAuthGuard)
  async getById(
    @Param() params: GetAssignmentByIdRequest,
  ): Promise<AppResponse<GetAssignmentByIdResponse>> {
    const data = await this.assignmentService.getAssignmentById(
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
