import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '../app.config';
import { AppResponse } from '../app.response';
import { LoggedInUser } from '../auth/decorators/logged-in-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../drizzle/schema';
import {
  GetPeerRatingsByScoringComponentIdRequest,
  RatePeerRequest,
} from './dto/peer-rating.request';
import {
  GetPeerRatingsByScoringComponentIdResponse,
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
    try {
      const result = await this.peerAssessmentService.ratePeer(
        data,
        user.userId,
      );
      return { data: result };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Get()
  @Roles([Role.Instructor])
  async getPeerRatingsByScoringComponentId(
    @Query() query: GetPeerRatingsByScoringComponentIdRequest,
  ): Promise<AppResponse<GetPeerRatingsByScoringComponentIdResponse>> {
    try {
      const data =
        await this.peerAssessmentService.getPeerRatingsByScoringComponentId(
          query.scoringComponentId,
          query.groupId,
        );
      return { data };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
