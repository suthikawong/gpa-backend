import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AppResponse } from '../app.response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoggedInUser } from '../auth/logged-in-user.decorator';
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

@UseGuards(JwtAuthGuard)
@Controller('peer-assessment')
export class PeerAssessmentController {
  constructor(private readonly peerAssessmentService: PeerAssessmentService) {}

  @Post()
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
  async getPeerAssessmentsByGroupId(
    @Query() query: GetPeerAssessmentsByGroupIdRequest,
  ): Promise<AppResponse<GetPeerAssessmentsByGroupIdResponse>> {
    const data = await this.peerAssessmentService.getPeerAssessmentsByGroupId(
      query.groupId,
    );
    return { data };
  }
}
