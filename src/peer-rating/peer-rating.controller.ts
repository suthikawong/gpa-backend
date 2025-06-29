import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '../app.config';
import { AppResponse } from '../app.response';
import { LoggedInUser } from '../auth/decorators/logged-in-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../drizzle/schema';
import {
  GetPeerRatingsByGroupIdRequest,
  RatePeerRequest,
} from './dto/peer-rating.request';
import {
  GetPeerRatingsByGroupIdResponse,
  RatePeerResponse,
} from './dto/peer-rating.response';
import { PeerRatingService } from './peer-rating.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('peer-rating')
export class PeerRatingController {
  constructor(private readonly peerAssessmentService: PeerRatingService) {}

  @Post()
  @Roles([Role.Student])
  async ratePeer(
    @Body() data: RatePeerRequest,
    @LoggedInUser() user: User,
  ): Promise<AppResponse<RatePeerResponse>> {
    const result = await this.peerAssessmentService.ratePeer(data, user.userId);
    return { data: result };
  }

  @Get()
  @Roles([Role.Instructor])
  async getPeerRatingsByGroupId(
    @Query() query: GetPeerRatingsByGroupIdRequest,
  ): Promise<AppResponse<GetPeerRatingsByGroupIdResponse>> {
    const data = await this.peerAssessmentService.getPeerRatingsByGroupId(
      query.scoringComponentId,
      query.groupId,
    );
    return { data };
  }
}
