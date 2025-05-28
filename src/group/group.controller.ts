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
import { RolesGuard } from '../auth/guards/roles.guard';
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

@UseGuards(JwtAuthGuard, RolesGuard)
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
    @LoggedInUser() user: User,
  ): Promise<AppResponse<CreateGroupResponse>> {
    const group = await this.groupService.create(data, user.userId);
    return { data: group };
  }

  @Put()
  @Roles([Role.Instructor])
  async update(
    @Body() data: UpdateGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<UpdateGroupResponse>> {
    const group = await this.groupService.update(data, user.userId);
    return { data: group };
  }

  @Delete(':groupId')
  @Roles([Role.Instructor])
  async delete(
    @Param() params: DeleteGroupRequest,
  ): Promise<AppResponse<DeleteGroupResponse>> {
    const result = await this.groupService.delete(params.groupId);
    return { data: result };
  }

  @Post('join')
  @Roles([Role.Student])
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
  @Roles([Role.Student])
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
  @Roles([Role.Instructor])
  async getMembers(
    @Param() params: GetGroupMembersRequest,
  ): Promise<AppResponse<GetGroupMembersResponse>> {
    const result = await this.groupService.getGroupMembersById(params.groupId);
    return { data: result };
  }

  @Post('member')
  @Roles([Role.Instructor])
  async addMember(
    @Body() body: AddGroupMemberRequest,
  ): Promise<AppResponse<AddGroupMemberResponse>> {
    const result = await this.groupService.addGroupMember(body);
    return { data: result };
  }

  @Delete(':groupId/member/:studentUserId')
  @Roles([Role.Instructor])
  async deleteMember(
    @Param() params: DeleteGroupMemberRequest,
  ): Promise<AppResponse<DeleteGroupMemberResponse>> {
    const result = await this.groupService.deleteGroupMember(params);
    return { data: result };
  }
}
