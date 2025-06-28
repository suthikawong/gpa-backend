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
import { LoggedInUser } from '../auth/decorators/logged-in-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../drizzle/schema';
import {
  CreateGroupRequest,
  DeleteGroupRequest,
  GetGroupByIdRequest,
  UpdateGroupRequest,
} from './dto/group.request';
import {
  CreateGroupResponse,
  DeleteGroupResponse,
  GetGroupByIdResponse,
  UpdateGroupResponse,
} from './dto/group.response';
import { GroupService } from './group.service';

@UseGuards(JwtAuthGuard)
@Controller('group')
export class GroupController {
  constructor(private groupService: GroupService) {}

  @Get(':groupId')
  async getGroupById(
    @Param() data: GetGroupByIdRequest,
  ): Promise<AppResponse<GetGroupByIdResponse>> {
    const group = await this.groupService.getGroupById(data);
    return { data: group };
  }

  @Post()
  async createGroup(
    @Body() data: CreateGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<CreateGroupResponse>> {
    const group = await this.groupService.createGroup(data, user.userId);
    return { data: group };
  }

  @Put()
  async updateGroup(
    @Body() data: UpdateGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<UpdateGroupResponse>> {
    const group = await this.groupService.updateGroup(data, user.userId);
    return { data: group };
  }

  @Delete(':groupId')
  async deleteGroup(
    @Param() data: DeleteGroupRequest,
  ): Promise<AppResponse<DeleteGroupResponse>> {
    const result = await this.groupService.deleteGroup(data.groupId);
    return { data: result };
  }
}
