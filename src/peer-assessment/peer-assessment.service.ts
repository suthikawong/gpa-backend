import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { PeerAssessment } from '../drizzle/schema';
import { GroupService } from '../group/group.service';
import { AssessPeerRequest } from './dto/peer-assessment.request';
import {
  AssessPeerResponse,
  GetPeerAssessmentsByGroupIdResponse,
} from './dto/peer-assessment.response';

@Injectable()
export class PeerAssessmentService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly groupService: GroupService,
  ) {}

  async getPeerAssessmentsByGroupId(
    groupId: schema.Group['groupId'],
  ): Promise<GetPeerAssessmentsByGroupIdResponse> {
    const group = await this.groupService.getGroupById(groupId);

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
      .where(inArray(schema.users.userId, studentIds));

    const assessments = await this.db
      .select()
      .from(schema.peerAssessments)
      .innerJoin(
        schema.questions,
        eq(schema.peerAssessments.questionId, schema.questions.questionId),
      )
      .where(
        and(
          inArray(schema.peerAssessments.assessedStudentUserId, studentIds),
          eq(schema.peerAssessments.assignmentId, group.assignmentId),
        ),
      )
      .orderBy(
        schema.peerAssessments.assessedStudentUserId,
        schema.questions.displayOrder,
      );

    const assessmentObject = {};

    for (const item of assessments) {
      const peerAssessment = item.peer_assessments;
      const question = item.questions;
      const key = peerAssessment.assessedStudentUserId;
      if (!assessmentObject[key]) {
        assessmentObject[key] = [];
      }
      assessmentObject[key].push({
        assessorStudentUserId: peerAssessment.assessorStudentUserId,
        score: peerAssessment.score,
        questionId: question.questionId,
        question: question.question,
        displayOrder: question.displayOrder,
      });
    }

    const result = users.map((user) => ({
      ...user,
      ratings: assessmentObject[user.userId] ?? [],
    }));

    return result;
  }

  async assessPeer(
    data: AssessPeerRequest,
    assessorStudentUserId: PeerAssessment['assessorStudentUserId'],
  ): Promise<AssessPeerResponse> {
    const values = data.ratings.map((rating) => ({
      assessorStudentUserId,
      assignmentId: data.assignmentId,
      assessedStudentUserId: data.assessedStudentUserId,
      questionId: rating.questionId,
      score: rating.score,
      createdDate: new Date(),
    }));

    await this.db.insert(schema.peerAssessments).values(values);

    return {
      assessedStudentUserId: data.assessedStudentUserId,
    };
  }
}
