import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '../app.config';
import { AppResponse } from '../app.response';
import { LoggedInUser } from '../auth/decorators/logged-in-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../drizzle/schema';
import {
  AssessPeerRequest,
  GetPeerAssessmentsByGroupIdRequest,
} from './dto/peer-assessment.request';
import {
  AssessPeerResponse,
  GetPeerAssessmentsByGroupIdResponse,
} from './dto/peer-assessment.response';
import { PeerAssessmentService } from './peer-assessment.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('peer-assessment')
export class PeerAssessmentController {
  constructor(private readonly peerAssessmentService: PeerAssessmentService) {}

  @Post()
  @Roles([Role.Student])
  async assessPeer(
    @Body() data: AssessPeerRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<AssessPeerResponse>> {
    const result = await this.peerAssessmentService.assessPeer(
      data,
      user.userId,
    );
    return { data: result };
  }

  @Get()
  @Roles([Role.Instructor])
  async getPeerAssessmentsByGroupId(
    @Query() query: GetPeerAssessmentsByGroupIdRequest,
  ): Promise<AppResponse<GetPeerAssessmentsByGroupIdResponse>> {
    const data = await this.peerAssessmentService.getPeerAssessmentsByGroupId(
      query.groupId,
    );
    return { data };
  }
}
