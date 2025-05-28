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

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get(':groupId')
  @UseGuards(JwtAuthGuard)
  async getById(
    @Param() params: GetGroupByIdRequest,
  ): Promise<AppResponse<GetGroupByIdResponse>> {
    const group = await this.groupService.getGroupById(params.groupId);
    return { data: group };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() data: CreateGroupRequest,
  ): Promise<AppResponse<CreateGroupResponse>> {
    const group = await this.groupService.create(data);
    return { data: group };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async update(
    @Body() data: UpdateGroupRequest,
  ): Promise<AppResponse<UpdateGroupResponse>> {
    const group = await this.groupService.update(data);
    return { data: group };
  }

  @Delete(':groupId')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param() params: DeleteGroupRequest,
  ): Promise<AppResponse<DeleteGroupResponse>> {
    const result = await this.groupService.delete(params.groupId);
    return { data: result };
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async getMembers(
    @Param() params: GetGroupMembersRequest,
  ): Promise<AppResponse<GetGroupMembersResponse>> {
    const result = await this.groupService.getGroupMembersById(params.groupId);
    return { data: result };
  }

  @Post('member')
  @UseGuards(JwtAuthGuard)
  async addMember(
    @Body() body: AddGroupMemberRequest,
  ): Promise<AppResponse<AddGroupMemberResponse>> {
    const result = await this.groupService.addGroupMember(body);
    return { data: result };
  }

  @Delete(':groupId/member/:studentUserId')
  @UseGuards(JwtAuthGuard)
  async deleteMember(
    @Param() params: DeleteGroupMemberRequest,
  ): Promise<AppResponse<DeleteGroupMemberResponse>> {
    const result = await this.groupService.deleteGroupMember(params);
    return { data: result };
  }
}
