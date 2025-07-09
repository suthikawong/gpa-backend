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
  CalculateScoresRequest,
  CreateGroupRequest,
  DeleteGroupMemberRequest,
  DeleteGroupRequest,
  GetGroupByIdRequest,
  GetGroupMembersRequest,
  GetScoresRequest,
  JoinGroupRequest,
  LeaveGroupRequest,
  UpdateGroupRequest,
  UpsertScoresRequest,
} from './dto/group.request';
import {
  AddGroupMemberResponse,
  CalculateScoresResponse,
  CreateGroupResponse,
  DeleteGroupMemberResponse,
  DeleteGroupResponse,
  GetGroupByIdResponse,
  GetGroupMembersResponse,
  GetScoresResponse,
  JoinGroupResponse,
  LeaveGroupResponse,
  UpdateGroupResponse,
  UpsertScoresResponse,
} from './dto/group.response';
import { GroupService } from './group.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('group')
export class GroupController {
  constructor(private groupService: GroupService) {}

  @Get(':groupId')
  @Roles([Role.Instructor, Role.Student])
  async getGroupById(
    @Param() data: GetGroupByIdRequest,
  ): Promise<AppResponse<GetGroupByIdResponse>> {
    const group = await this.groupService.getGroupById(data.groupId);
    return { data: group };
  }

  @Post()
  @Roles([Role.Instructor, Role.Student])
  async createGroup(
    @Body() data: CreateGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<CreateGroupResponse>> {
    const group = await this.groupService.createGroup(
      data,
      user.userId,
      user.roleId,
    );
    return { data: group };
  }

  @Put()
  @Roles([Role.Instructor, Role.Student])
  async updateGroup(
    @Body() data: UpdateGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<UpdateGroupResponse>> {
    const group = await this.groupService.updateGroup(data, user.userId);
    return { data: group };
  }

  @Delete(':groupId')
  @Roles([Role.Instructor, Role.Student])
  async deleteGroup(
    @Param() data: DeleteGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<DeleteGroupResponse>> {
    const result = await this.groupService.deleteGroup(
      data.groupId,
      user.roleId,
    );
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
  async getMembersByGroupId(
    @Param() params: GetGroupMembersRequest,
  ): Promise<AppResponse<GetGroupMembersResponse>> {
    const result = await this.groupService.getMembersByGroupId(params.groupId);
    return { data: result };
  }

  @Post('member')
  @Roles([Role.Instructor])
  async addGroupMember(
    @Body() body: AddGroupMemberRequest,
  ): Promise<AppResponse<AddGroupMemberResponse>> {
    const result = await this.groupService.addGroupMember(body);
    return { data: result };
  }

  @Delete(':groupId/member/:studentUserId')
  @Roles([Role.Instructor])
  async deleteGroupMember(
    @Param() params: DeleteGroupMemberRequest,
  ): Promise<AppResponse<DeleteGroupMemberResponse>> {
    const result = await this.groupService.deleteGroupMember(params);
    return { data: result };
  }

  @Get(':groupId/score')
  @Roles([Role.Instructor])
  async getScores(
    @Param() params: GetScoresRequest,
  ): Promise<AppResponse<GetScoresResponse>> {
    const data = await this.groupService.getScores(params.groupId);
    return { data };
  }

  @Post('score')
  @Roles([Role.Instructor])
  async upsertScore(
    @Body() data: UpsertScoresRequest,
  ): Promise<AppResponse<UpsertScoresResponse>> {
    const result = await this.groupService.upsertScore(data);
    return { data: result };
  }

  @Post('calculate-score')
  @Roles([Role.Instructor])
  async calculateScore(
    @Body() data: CalculateScoresRequest,
  ): Promise<AppResponse<CalculateScoresResponse>> {
    const result = await this.groupService.calculateScore(data);
    return { data: result };
  }
}
