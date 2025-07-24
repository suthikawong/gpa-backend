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
import { QASSMode } from 'src/utils/qass.model';
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
  CreateRandomGroupsRequest,
  DeleteGroupMemberRequest,
  DeleteGroupRequest,
  GetGroupByIdRequest,
  GetGroupMembersRequest,
  GetScoresRequest,
  ImportGroupsRequest,
  JoinGroupRequest,
  LeaveGroupRequest,
  UpdateGroupRequest,
  UpsertScoresRequest,
  VerifyImportGroupsRequest,
} from './dto/group.request';
import {
  AddGroupMemberResponse,
  CalculateScoresResponse,
  CreateGroupResponse,
  CreateRandomGroupsResponse,
  DeleteGroupMemberResponse,
  DeleteGroupResponse,
  GetGroupByIdResponse,
  GetGroupMembersResponse,
  GetScoresResponse,
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

  @Post('import')
  @Roles([Role.Instructor])
  @UseInterceptors(FileInterceptor('file'))
  async importGroups(
    @Body() data: ImportGroupsRequest,
    @UploadedFile() file: Express.Multer.File,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<ImportGroupsResponse>> {
    const result = await this.groupService.importGroups(
      data,
      file,
      user.userId,
    );
    return { data: result };
  }

  @Post('verify-import')
  @Roles([Role.Instructor])
  @UseInterceptors(FileInterceptor('file'))
  async verifyImportGroups(
    @Body() data: VerifyImportGroupsRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AppResponse<VerifyImportGroupsResponse>> {
    const result = await this.groupService.verifyImportGroups(data, file);
    return { data: result };
  }

  @Post('random')
  @Roles([Role.Instructor])
  async createRandomGroups(
    @Body() data: CreateRandomGroupsRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<CreateRandomGroupsResponse>> {
    const result = await this.groupService.createRandomGroups(
      data,
      user.userId,
    );
    return { data: result };
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

  // @Post('calculate-score/qass')
  // // @Roles([Role.Instructor])
  // async calcualteScoresByQASS(
  //   @Body()
  //   data: {
  //     peerMatrix: number[][];
  //     groupProductScore: number;
  //     peerRatingImpact: number;
  //     groupSpread: number;
  //     tuningFactor: number;
  //     peerRatingWeights: number[];
  //     mode: QASSMode;
  //   },
  // ): Promise<AppResponse<number[]>> {
  //   const result = this.groupService.calcualteScoresByQASS(
  //     data.peerMatrix,
  //     data.groupProductScore,
  //     data.peerRatingImpact,
  //     data.groupSpread,
  //     data.tuningFactor,
  //     data.peerRatingWeights,
  //     data.mode,
  //   );
  //   return { data: result };
  // }

  // @Post('calculate-score/webavalia')
  // // @Roles([Role.Instructor])
  // async calcualteScoresByWebavalia(
  //   @Body()
  //   data: {
  //     peerRating: (number | null)[][];
  //     groupScore: number;
  //     saWeight: number;
  //     paWeight: number;
  //   },
  // ): Promise<AppResponse<number[] | null>> {
  //   const result = this.groupService.calcualteScoresByWebavalia(
  //     data.peerRating,
  //     data.groupScore,
  //     data.saWeight,
  //     data.paWeight,
  //   );
  //   return { data: result };
  // }
}
