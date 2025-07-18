import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { PeerRating } from '../drizzle/schema';
import { GroupService } from '../group/group.service';
import { ScoringComponentService } from '../scoring-component/scoring-component.service';
import { RatePeerRequest } from './dto/peer-rating.request';
import {
  GetPeerRatingsByScoringComponentIdResponse,
  PeerRatingItem,
  RatePeerResponse,
} from './dto/peer-rating.response';

@Injectable()
export class PeerRatingService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly groupService: GroupService,
    private readonly scoringComponentService: ScoringComponentService,
  ) {}

  async getPeerRatingsByScoringComponentId(
    scoringComponentId: schema.ScoringComponent['scoringComponentId'],
    groupId: schema.Group['groupId'],
  ): Promise<GetPeerRatingsByScoringComponentIdResponse> {
    const group = await this.groupService.getGroupById(groupId);
    await this.scoringComponentService.getScoringComponentById(
      scoringComponentId,
    );
    const assessment = await this.db.query.assessments.findFirst({
      where: eq(schema.assessments.assessmentId, group.assessmentId),
    });
    const modelConfig = assessment?.modelConfig as { selfRating: boolean };
    const selfRating = modelConfig?.selfRating;

    const members = await this.db
      .select({ studentUserId: schema.groupMembers.studentUserId })
      .from(schema.groupMembers)
      .where(eq(schema.groupMembers.groupId, groupId));

    const studentIds = members.map((m) => m.studentUserId);
    if (studentIds.length === 0) {
      return [];
    }

    const users = await this.db
      .select({
        userId: schema.users.userId,
        name: schema.users.name,
        email: schema.users.email,
        roleId: schema.users.roleId,
      })
      .from(schema.users)
      .where(inArray(schema.users.userId, studentIds))
      .orderBy(schema.users.name);

    const peerRating = await this.db
      .select()
      .from(schema.peerRatings)
      .where(
        and(
          inArray(schema.peerRatings.rateeStudentUserId, studentIds),
          eq(schema.peerRatings.scoringComponentId, scoringComponentId),
        ),
      );

    const peerRatingObject = {}; // [ratee][rater]

    for (const item of peerRating) {
      const rateeUserId = item.rateeStudentUserId;
      if (!peerRatingObject[rateeUserId]) {
        peerRatingObject[rateeUserId] = {};
      }
      peerRatingObject[rateeUserId][item.raterStudentUserId] = {
        raterStudentUserId: item.raterStudentUserId,
        score: item.score,
        comment: item.comment,
      };
    }

    const result: GetPeerRatingsByScoringComponentIdResponse = [];

    for (let ratee of users) {
      const ratings: PeerRatingItem[] = [];
      for (let rater of users) {
        if (ratee.userId === rater.userId && !selfRating) {
          continue;
        }
        if (peerRatingObject?.[ratee.userId]?.[rater.userId]) {
          ratings.push(peerRatingObject[ratee.userId][rater.userId]);
        } else {
          ratings.push({ raterStudentUserId: rater.userId });
        }
      }
      result.push({ ...ratee, ratings });
    }

    return result;
  }

  async ratePeer(
    data: RatePeerRequest,
    raterStudentUserId: PeerRating['raterStudentUserId'],
  ): Promise<RatePeerResponse> {
    await this.scoringComponentService.getScoringComponentById(
      data.scoringComponentId,
    );

    await this.db.insert(schema.peerRatings).values(
      data.studentScores.map((value) => ({
        ...value,
        scoringComponentId: data.scoringComponentId,
        groupId: data.groupId,
        raterStudentUserId,
        createdDate: new Date(),
      })),
    );

    return {
      raterStudentUserId,
    };
  }
}
