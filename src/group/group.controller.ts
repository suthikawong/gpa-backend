import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AppResponse } from 'src/app.response';
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

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get(':groupId')
  async getById(
    @Param() params: GetGroupByIdRequest,
  ): Promise<AppResponse<GetGroupByIdResponse>> {
    const group = await this.groupService.getGroupById(params.groupId);
    return { data: group };
  }

  @Post()
  async create(
    @Body() data: CreateGroupRequest,
  ): Promise<AppResponse<CreateGroupResponse>> {
    const group = await this.groupService.create(data);
    return { data: group };
  }

  @Put()
  async update(
    @Body() data: UpdateGroupRequest,
  ): Promise<AppResponse<UpdateGroupResponse>> {
    const group = await this.groupService.update(data);
    return { data: group };
  }

  @Delete(':groupId')
  async delete(
    @Param() params: DeleteGroupRequest,
  ): Promise<AppResponse<DeleteGroupResponse>> {
    const result = await this.groupService.delete(params.groupId);
    return { data: result };
  }
}
