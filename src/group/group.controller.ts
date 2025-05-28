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
import { LoggedInUser } from '../auth/logged-in-user.decorator';
import { User } from '../drizzle/schema';
import {
  AddGroupMemberRequest,
  CreateGroupRequest,
  DeleteGroupMemberRequest,
  DeleteGroupRequest,
  GetGroupByIdRequest,
  GetGroupMembersRequest,
  JoinGroupRequest,
  LeaveGroupRequest,
  UpdateGroupRequest,
} from './dto/group.request';
import {
  AddGroupMemberResponse,
  CreateGroupResponse,
  DeleteGroupMemberResponse,
  DeleteGroupResponse,
  GetGroupByIdResponse,
  GetGroupMembersResponse,
  JoinGroupResponse,
  LeaveGroupResponse,
  UpdateGroupResponse,
} from './dto/group.response';
import { GroupService } from './group.service';

@UseGuards(JwtAuthGuard)
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

  @Post('join')
  async joinGroup(
    @Body() body: JoinGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<JoinGroupResponse>> {
    const result = await this.groupService.joinGroup(
      body.groupCode,
      user.userId,
    );
    return { data: result };
  }

  @Post('leave')
  async leaveGroup(
    @Body() body: LeaveGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<LeaveGroupResponse>> {
    const result = await this.groupService.leaveGroup(
      body.groupId,
      user.userId,
    );
    return { data: result };
  }

  @Get(':groupId/member')
  async getMembers(
    @Param() params: GetGroupMembersRequest,
  ): Promise<AppResponse<GetGroupMembersResponse>> {
    const result = await this.groupService.getGroupMembersById(params.groupId);
    return { data: result };
  }

  @Post('member')
  async addMember(
    @Body() body: AddGroupMemberRequest,
  ): Promise<AppResponse<AddGroupMemberResponse>> {
    const result = await this.groupService.addGroupMember(body);
    return { data: result };
  }

  @Delete(':groupId/member/:studentUserId')
  async deleteMember(
    @Param() params: DeleteGroupMemberRequest,
  ): Promise<AppResponse<DeleteGroupMemberResponse>> {
    const result = await this.groupService.deleteGroupMember(params);
    return { data: result };
  }
}
