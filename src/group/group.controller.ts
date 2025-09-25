import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '../app.config';
import { AppResponse } from '../app.response';
import { LoggedInUser } from '../auth/decorators/logged-in-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../drizzle/schema';
import {
  AddGroupMemberRequest,
  CalculateScoreByQassRequest,
  CalculateScoreByWebavaliaRequest,
  CreateGroupRequest,
  CreateRandomGroupsRequest,
  DeleteAllGroupMembersRequest,
  DeleteGroupMemberRequest,
  DeleteGroupRequest,
  GetGroupByIdRequest,
  GetGroupMembersRequest,
  GetScoresRequest,
  GetStudentsWithoutPeerAssessmentRequest,
  ImportGroupsRequest,
  JoinGroupRequest,
  LeaveGroupRequest,
  UpdateGroupRequest,
  UpsertScoresRequest,
  VerifyImportGroupsRequest,
} from './dto/group.request';
import {
  AddGroupMemberResponse,
  CalculateScoreByQassResponse,
  CalculateScoreByWebavaliaResponse,
  CreateGroupResponse,
  CreateRandomGroupsResponse,
  DeleteAllGroupMembersResponse,
  DeleteGroupMemberResponse,
  DeleteGroupResponse,
  GetGroupByIdResponse,
  GetGroupMembersResponse,
  GetScoresResponse,
  GetStudentsWithoutPeerAssessmentResponse,
  ImportGroupsResponse,
  JoinGroupResponse,
  LeaveGroupResponse,
  UpdateGroupResponse,
  UpsertScoresResponse,
  VerifyImportGroupsResponse,
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
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetGroupByIdResponse>> {
    try {
      await this.groupService.checkGroupPermission(user, data.groupId);
      const group = await this.groupService.getGroupById(data.groupId);
      return { data: group };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post()
  @Roles([Role.Instructor, Role.Student])
  async createGroup(
    @Body() data: CreateGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<CreateGroupResponse>> {
    try {
      const group = await this.groupService.createGroup(
        data,
        user.userId,
        user.roleId,
      );
      return { data: group };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('import')
  @Roles([Role.Instructor])
  @UseInterceptors(FileInterceptor('file'))
  async importGroups(
    @Body() data: ImportGroupsRequest,
    @UploadedFile() file: Express.Multer.File,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<ImportGroupsResponse>> {
    try {
      const result = await this.groupService.importGroups(
        data,
        file,
        user.userId,
      );
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('verify-import')
  @Roles([Role.Instructor])
  @UseInterceptors(FileInterceptor('file'))
  async verifyImportGroups(
    @Body() data: VerifyImportGroupsRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AppResponse<VerifyImportGroupsResponse>> {
    try {
      const result = await this.groupService.verifyImportGroups(data, file);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('random')
  @Roles([Role.Instructor])
  async createRandomGroups(
    @Body() data: CreateRandomGroupsRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<CreateRandomGroupsResponse>> {
    try {
      const result = await this.groupService.createRandomGroups(
        data,
        user.userId,
      );
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Put()
  @Roles([Role.Instructor, Role.Student])
  async updateGroup(
    @Body() data: UpdateGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<UpdateGroupResponse>> {
    try {
      const group = await this.groupService.updateGroup(data, user.userId);
      return { data: group };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Delete(':groupId')
  @Roles([Role.Instructor, Role.Student])
  async deleteGroup(
    @Param() data: DeleteGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<DeleteGroupResponse>> {
    try {
      const result = await this.groupService.deleteGroup(
        data.groupId,
        user.roleId,
      );
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('join')
  @Roles([Role.Student])
  async joinGroup(
    @Body() body: JoinGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<JoinGroupResponse>> {
    try {
      const result = await this.groupService.joinGroup(
        body.groupCode,
        user.userId,
      );
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('leave')
  @Roles([Role.Student])
  async leaveGroup(
    @Body() body: LeaveGroupRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<LeaveGroupResponse>> {
    try {
      const result = await this.groupService.leaveGroup(
        body.groupId,
        user.userId,
      );
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Get(':groupId/member')
  @Roles([Role.Instructor])
  async getMembersByGroupId(
    @Param() params: GetGroupMembersRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<GetGroupMembersResponse>> {
    try {
      await this.groupService.checkGroupPermission(user, params.groupId);
      const result = await this.groupService.getMembersByGroupId(
        params.groupId,
      );
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('member')
  @Roles([Role.Instructor])
  async addGroupMember(
    @Body() body: AddGroupMemberRequest,
  ): Promise<AppResponse<AddGroupMemberResponse>> {
    try {
      const result = await this.groupService.addGroupMember(body);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Delete(':groupId/member/:studentUserId')
  @Roles([Role.Instructor])
  async deleteGroupMember(
    @Param() params: DeleteGroupMemberRequest,
  ): Promise<AppResponse<DeleteGroupMemberResponse>> {
    try {
      const result = await this.groupService.deleteGroupMember(params);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Delete(':groupId/member')
  @Roles([Role.Instructor])
  async deleteAllGroupMembers(
    @Param() data: DeleteAllGroupMembersRequest,
  ): Promise<AppResponse<DeleteAllGroupMembersResponse>> {
    try {
      const result = await this.groupService.deleteAllGroupMembers(data);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Get(':groupId/score')
  @Roles([Role.Instructor])
  async getScores(
    @Param() params: GetScoresRequest,
  ): Promise<AppResponse<GetScoresResponse>> {
    try {
      const data = await this.groupService.getScores(params.groupId);
      return { data };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('score')
  @Roles([Role.Instructor])
  async upsertScore(
    @Body() data: UpsertScoresRequest,
  ): Promise<AppResponse<UpsertScoresResponse>> {
    try {
      const result = await this.groupService.upsertScore(data);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('calculate/qass')
  @Roles([Role.Instructor])
  async calculateScoreByQass(
    @Body() data: CalculateScoreByQassRequest,
  ): Promise<AppResponse<CalculateScoreByQassResponse>> {
    try {
      const result = await this.groupService.calculateScoreByQass(data);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Post('calculate/webavalia')
  @Roles([Role.Instructor])
  async calculateScoreByWebavalia(
    @Body() data: CalculateScoreByWebavaliaRequest,
  ): Promise<AppResponse<CalculateScoreByWebavaliaResponse>> {
    try {
      const result = await this.groupService.calculateScoreByWebavalia(data);
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Get(':groupId/students/no-rating')
  @Roles([Role.Instructor])
  async getStudentsWithoutPeerAssessment(
    @Param() params: GetStudentsWithoutPeerAssessmentRequest,
  ): Promise<AppResponse<GetStudentsWithoutPeerAssessmentResponse>> {
    try {
      const data =
        await this.groupService.getStudentsWithoutPeerAssessment(params);
      return { data };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
