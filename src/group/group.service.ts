import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { format } from 'date-fns';
import { and, asc, count, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import ExcelJS from 'exceljs';
import { AssessmentModel, Role } from '../app.config';
import { AssessmentService } from '../assessment/assessment.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { Group, User } from '../drizzle/schema';
import { PeerRatingService } from '../peer-rating/peer-rating.service';
import { UserService } from '../user/user.service';
import { generateCode } from '../utils/generate-code';
import {
  calculateStudentsScoresFromAllComponentsByQASS,
  QASSMode,
} from '../utils/qass.model';
import { calculateStudentGradesFromAllComponentsByWebavalia } from '../utils/webavalia-model';
import {
  AddGroupMemberRequest,
  CalculateScoreByQassRequest,
  CalculateScoreByWebavaliaRequest,
  CreateGroupRequest,
  CreateRandomGroupsRequest,
  DeleteAllGroupMembersRequest,
  DeleteGroupMemberRequest,
  ImportGroupsRequest,
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

type QassModelConfig = {
  mode: string;
  groupSpread: number;
  polishingFactor: number;
  peerRatingImpact: number;
};

type WebavaliaModelConfig = { selfWeight: number };

@Injectable()
export class GroupService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,

    private readonly assessmentService: AssessmentService,
    private readonly userService: UserService,
    private readonly peerRatingService: PeerRatingService,
  ) {}

  async getGroupById(
    groupId: schema.Group['groupId'],
  ): Promise<GetGroupByIdResponse> {
    const group = await this.db.query.groups.findFirst({
      where: eq(schema.groups.groupId, groupId),
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const [result] = await this.db
      .select({ count: count(schema.groupMembers.studentUserId) })
      .from(schema.groupMembers)
      .where(eq(schema.groupMembers.groupId, groupId));

    return { ...group, memberCount: result.count };
  }

  async createGroup(
    data: CreateGroupRequest,
    createdBy: schema.User['userId'],
    roleId: User['roleId'],
  ): Promise<CreateGroupResponse> {
    await this.assessmentService.getAssessmentById(data.assessmentId);
    await this.checkUserRole(data.assessmentId, roleId);

    const groupCode = await this.generateUniqueCode();

    const [group] = await this.db
      .insert(schema.groups)
      .values({ ...data, groupCode, createdBy, createdDate: new Date() })
      .returning();

    return group;
  }

  async verifyImportGroups(
    data: VerifyImportGroupsRequest,
    file: Express.Multer.File,
  ): Promise<VerifyImportGroupsResponse> {
    const { assessmentId } = data;
    const errors: { row: number; message: string }[] = [];

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const sheet = workbook.worksheets[0];

    const rows: { email: string; groupName: string }[] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const email = String(row.getCell(1).text || '').trim();
      const groupName = String(row.getCell(2).value || '').trim();
      rows.push({ email, groupName });
    });

    const students = await this.db
      .select({
        userId: schema.users.userId,
        name: schema.users.name,
        email: schema.users.email,
        roleId: schema.users.roleId,
      })
      .from(schema.assessmentStudent)
      .innerJoin(
        schema.users,
        eq(schema.assessmentStudent.studentUserId, schema.users.userId),
      )
      .where(eq(schema.assessmentStudent.assessmentId, assessmentId));

    const studentsByEmail = new Map(students.map((s) => [s.email, s.userId]));

    const missingEmails = new Set(studentsByEmail.keys());
    const groupsMap = new Map<string, number[]>();

    rows.forEach((row, index) => {
      if (!studentsByEmail.has(row.email)) {
        errors.push({
          row: index + 2,
          message: `Student email ${row.email} not found in this assessment.`,
        });
        return;
      }

      missingEmails.delete(row.email);

      if (!groupsMap.has(row.groupName)) {
        groupsMap.set(row.groupName, []);
      }
      groupsMap.get(row.groupName)!.push(studentsByEmail.get(row.email)!);
    });

    if (missingEmails.size > 0) {
      Array.from(missingEmails).forEach((email) => {
        const student = students.find((s) => s.email === email);
        if (student) {
          errors.push({
            row: -1,
            message: `Student ${email} is missing in uploaded file.`,
          });
        }
      });
    }
    errors.sort((a, b) => a.row - b.row);
    return { errors, groupsMap };
  }

  async importGroups(
    data: ImportGroupsRequest,
    file: Express.Multer.File,
    createdBy: schema.User['userId'],
  ): Promise<ImportGroupsResponse> {
    const { assessmentId } = data;

    const { errors, groupsMap } = await this.verifyImportGroups(data, file);

    if (errors.length > 0) {
      return { success: false, errors };
    }

    await this.db.transaction(async (tx) => {
      const existingGroups = await tx.query.groups.findMany({
        where: eq(schema.groups.assessmentId, assessmentId),
      });

      const groupIds = existingGroups.map((g) => g.groupId);

      if (groupIds.length > 0) {
        await tx
          .delete(schema.groups)
          .where(inArray(schema.groups.groupId, groupIds));
      }

      for (const [groupName, userIds] of groupsMap.entries()) {
        const groupCode = await this.generateUniqueCode();
        const [group] = await tx
          .insert(schema.groups)
          .values({
            assessmentId,
            groupName,
            groupCode,
            createdBy,
            createdDate: new Date(),
          })
          .returning();

        await tx.insert(schema.groupMembers).values(
          userIds.map((studentUserId) => ({
            groupId: group.groupId,
            studentUserId,
            assessmentId,
            createdDate: new Date(),
          })),
        );
      }
    });

    return { success: true, errors };
  }

  async createRandomGroups(
    data: CreateRandomGroupsRequest,
    createdBy: schema.User['userId'],
  ): Promise<CreateRandomGroupsResponse> {
    const { assessmentId, groupSize } = data;

    const students = await this.db.query.assessmentStudent.findMany({
      where: eq(schema.assessmentStudent.assessmentId, assessmentId),
    });

    if (students.length === 0) {
      throw new BadRequestException('There is no student to add to groups');
    }

    const shuffled = students
      .map((s) => s.studentUserId)
      .sort(() => Math.random() - 0.5);

    const groups: {
      groupName: string;
      studentUserIds: number[];
    }[] = [];

    for (let i = 0; i < shuffled.length; i += groupSize) {
      const members = shuffled.slice(i, i + groupSize);
      groups.push({
        groupName: `Group ${groups.length + 1}`,
        studentUserIds: members,
      });
    }

    await this.db.transaction(async (tx) => {
      const existingGroups = await tx.query.groups.findMany({
        where: eq(schema.groups.assessmentId, assessmentId),
      });

      const existingGroupIds = existingGroups.map((g) => g.groupId);

      if (existingGroupIds.length > 0) {
        await tx
          .delete(schema.groups)
          .where(inArray(schema.groups.groupId, existingGroupIds));
      }

      for (const g of groups) {
        const groupCode = await this.generateUniqueCode();

        const [group] = await tx
          .insert(schema.groups)
          .values({
            assessmentId,
            groupCode,
            groupName: g.groupName,
            createdBy,
            createdDate: new Date(),
          })
          .returning();

        await tx.insert(schema.groupMembers).values(
          g.studentUserIds.map((studentUserId) => ({
            studentUserId,
            assessmentId,
            groupId: group.groupId,
            createdDate: new Date(),
          })),
        );
      }
    });

    return { success: true };
  }

  async updateGroup(
    data: UpdateGroupRequest,
    updatedBy: schema.User['userId'],
  ): Promise<UpdateGroupResponse> {
    const existing = await this.db.query.groups.findFirst({
      where: eq(schema.groups.groupId, data.groupId),
    });

    if (!existing) throw new NotFoundException('Group not found');

    const [group] = await this.db
      .update(schema.groups)
      .set({ ...data, updatedBy, updatedDate: new Date() })
      .where(eq(schema.groups.groupId, data.groupId))
      .returning();

    return group;
  }

  async deleteGroup(
    groupId: Group['groupId'],
    roleId: User['roleId'],
  ): Promise<DeleteGroupResponse> {
    const group = await this.db.query.groups.findFirst({
      where: eq(schema.groups.groupId, groupId),
    });

    if (!group) throw new NotFoundException('Group not found');

    await this.checkUserRole(group.assessmentId, roleId);

    await this.db
      .delete(schema.groups)
      .where(eq(schema.groups.groupId, groupId));

    return { groupId: group.groupId };
  }

  async joinGroup(
    groupCode: schema.Group['groupCode'],
    studentUserId: schema.User['userId'],
  ): Promise<JoinGroupResponse> {
    const group = await this.db.query.groups.findFirst({
      where: eq(schema.groups.groupCode, groupCode),
    });
    if (!group) {
      throw new BadRequestException('Group not found.');
    }

    const existing = await this.db.query.groupMembers.findFirst({
      where: and(
        eq(schema.groupMembers.groupId, group.groupId),
        eq(schema.groupMembers.studentUserId, studentUserId),
      ),
    });
    if (existing) {
      throw new BadRequestException('You already joined this group.');
    }

    await this.checkScoringComponentStarted(group.assessmentId);

    await this.db.insert(schema.groupMembers).values({
      groupId: group.groupId,
      assessmentId: group.assessmentId,
      studentUserId,
      createdDate: new Date(),
    });

    return { group };
  }

  async leaveGroup(
    groupId: schema.Group['groupId'],
    studentUserId: schema.User['userId'],
  ): Promise<LeaveGroupResponse> {
    const group = await this.getGroupById(groupId);
    await this.checkScoringComponentStarted(group.assessmentId);

    await this.db
      .delete(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, groupId),
          eq(schema.groupMembers.studentUserId, studentUserId),
        ),
      );

    return { groupId };
  }

  async getMembersByGroupId(
    groupId: schema.Group['groupId'],
  ): Promise<GetGroupMembersResponse> {
    await this.getGroupById(groupId);
    const members = await this.db
      .select({
        userId: schema.users.userId,
        name: schema.users.name,
        email: schema.users.email,
        roleId: schema.users.roleId,
      })
      .from(schema.groupMembers)
      .innerJoin(
        schema.users,
        eq(schema.groupMembers.studentUserId, schema.users.userId),
      )
      .where(eq(schema.groupMembers.groupId, groupId))
      .orderBy(schema.users.userId);

    return members;
  }

  async addGroupMember(
    data: AddGroupMemberRequest,
  ): Promise<AddGroupMemberResponse> {
    await this.userService.getUserById(data.studentUserId);
    const group = await this.getGroupById(data.groupId);
    await this.checkScoringComponentStarted(group.assessmentId);

    const existing = await this.db.query.groupMembers.findFirst({
      where: and(
        eq(schema.groupMembers.groupId, group.groupId),
        eq(schema.groupMembers.studentUserId, data.studentUserId),
      ),
    });
    if (existing) {
      throw new BadRequestException('Student already joined this group.');
    }

    await this.db
      .delete(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.assessmentId, group.assessmentId),
          eq(schema.groupMembers.studentUserId, data.studentUserId),
        ),
      );

    await this.db.insert(schema.groupMembers).values({
      ...data,
      assessmentId: group.assessmentId,
      createdDate: new Date(),
    });
    return { studentUserId: data.studentUserId };
  }

  async deleteGroupMember(
    data: DeleteGroupMemberRequest,
  ): Promise<DeleteGroupMemberResponse> {
    await this.userService.getUserById(data.studentUserId);
    const group = await this.getGroupById(data.groupId);
    await this.checkScoringComponentStarted(group.assessmentId);

    await this.db
      .delete(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.groupId, data.groupId),
          eq(schema.groupMembers.studentUserId, data.studentUserId),
        ),
      );
    return { studentUserId: data.studentUserId };
  }

  async deleteAllGroupMembers(
    data: DeleteAllGroupMembersRequest,
  ): Promise<DeleteGroupResponse> {
    const group = await this.getGroupById(data.groupId);
    await this.checkScoringComponentStarted(group.assessmentId);

    await this.db
      .delete(schema.groupMembers)
      .where(eq(schema.groupMembers.groupId, data.groupId));

    return { groupId: group.groupId };
  }

  async getScores(
    groupId: schema.Group['groupId'],
  ): Promise<GetScoresResponse> {
    await this.getGroupById(groupId);

    const groupScore = await this.db.query.groupScores.findFirst({
      where: eq(schema.groupScores.groupId, groupId),
    });

    const studentScores = await this.db.query.studentScores.findMany({
      where: eq(schema.studentScores.groupId, groupId),
    });

    const members = await this.db
      .select({
        userId: schema.users.userId,
        name: schema.users.name,
        email: schema.users.email,
        roleId: schema.users.roleId,
      })
      .from(schema.groupMembers)
      .innerJoin(
        schema.users,
        eq(schema.groupMembers.studentUserId, schema.users.userId),
      )
      .where(eq(schema.groupMembers.groupId, groupId))
      .orderBy(asc(schema.users.userId));

    const studentScoreMapping = {};

    studentScores.forEach((student) => {
      studentScoreMapping[student.studentUserId] = student;
    });

    const studentScoresResult = members.map((member) => ({
      ...member,
      studentScore: studentScoreMapping[member.userId] ?? null,
    }));

    return {
      groupScore: groupScore ?? null,
      studentScores: studentScoresResult,
    };
  }

  async upsertScore(data: UpsertScoresRequest): Promise<UpsertScoresResponse> {
    const { groupScore: currGroupScore, studentScores: currStudentScores } =
      await this.getScores(data.groupId);

    // upsert group score
    if (!data?.groupScore && currGroupScore) {
      await this.db
        .delete(schema.groupScores)
        .where(eq(schema.groupScores.groupId, data.groupId));
    } else if (data?.groupScore && !currGroupScore) {
      await this.db.insert(schema.groupScores).values({
        groupId: data.groupId,
        score: data.groupScore,
        createdDate: new Date(),
      });
    } else if (data?.groupScore !== currGroupScore?.score) {
      await this.db
        .update(schema.groupScores)
        .set({ score: data.groupScore, updatedDate: new Date() })
        .where(eq(schema.groupScores.groupId, data.groupId));
    }

    const deleteScoreSet = new Set<schema.StudentScore['studentUserId']>(
      currStudentScores
        .map((item) => item?.studentScore?.studentUserId)
        .filter((item) => !!item),
    );

    // upsert student scores
    const promises = data.studentScores.map(
      ({ studentUserId, score, remark }) => {
        const currStudentScore = currStudentScores.find(
          (item) => item?.studentScore?.studentUserId === studentUserId,
        );

        if (score && currStudentScore?.studentScore?.score) {
          if (deleteScoreSet.has(studentUserId))
            deleteScoreSet.delete(studentUserId);
          return this.db
            .update(schema.studentScores)
            .set({ score, remark: remark ?? null, updatedDate: new Date() })
            .where(
              and(
                eq(schema.studentScores.groupId, data.groupId),
                eq(schema.studentScores.studentUserId, studentUserId),
              ),
            );
        }

        if (score) {
          if (deleteScoreSet.has(studentUserId))
            deleteScoreSet.delete(studentUserId);
          return this.db.insert(schema.studentScores).values({
            groupId: data.groupId,
            studentUserId,
            score,
            remark,
            createdDate: new Date(),
          });
        }
      },
    );

    await Promise.all(promises);
    await this.db
      .delete(schema.studentScores)
      .where(
        and(
          eq(schema.studentScores.groupId, data.groupId),
          inArray(schema.studentScores.studentUserId, [...deleteScoreSet]),
        ),
      );

    return { groupId: data.groupId };
  }

  async calculateScoreByQass(
    data: CalculateScoreByQassRequest,
  ): Promise<CalculateScoreByQassResponse> {
    const {
      groupId,
      groupScore,
      mode,
      groupSpread,
      polishingFactor,
      peerRatingImpact,
    } = data;
    const { assessment, group, scoringComponents } =
      await this.validateParameters({ model: AssessmentModel.QASS, groupId });
    const peerRatingWeights = data.weights.sort((a, b) => a.userId - b.userId);
    const userIds = peerRatingWeights.map((item) => item.userId);
    const { peerMatrix, scoringComponentWeights } = await this.prepareData({
      assessment,
      group,
      scoringComponents,
    });

    const sumWeights = peerRatingWeights.reduce(
      (prev, curr) => prev + curr.weight,
      0,
    );
    const weights = peerRatingWeights.map((item) => item.weight / sumWeights);

    const studentScores = calculateStudentsScoresFromAllComponentsByQASS({
      peerMatrix,
      peerRatingImpact,
      groupSpread,
      polishingFactor,
      scoringComponentWeights,
      mode: mode as QASSMode,
      groupProductScore: groupScore,
      peerRatingWeights: weights,
    });

    const updatedScores = userIds.map((userId, i) => ({
      studentUserId: userId,
      score: parseFloat(studentScores[i].toFixed(4))!,
    }));

    await this.upsertScore({
      groupId,
      groupScore,
      studentScores: updatedScores,
    });

    return { groupId: data.groupId };
  }

  async calculateScoreByWebavalia(
    data: CalculateScoreByWebavaliaRequest,
  ): Promise<CalculateScoreByWebavaliaResponse> {
    const groupId = data.groupId;
    const { assessment, group, scoringComponents } =
      await this.validateParameters({
        model: AssessmentModel.WebAVALIA,
        groupId,
      });
    const members = await this.getMembersByGroupId(groupId);
    const userIds = members.map((item) => item.userId);
    const { peerMatrix, scoringComponentWeights } = await this.prepareData({
      assessment,
      group,
      scoringComponents,
    });
    const { selfWeight } = assessment?.modelConfig as WebavaliaModelConfig;

    // validate sum scores form each rater must sum up to 100
    scoringComponents.forEach((sc, k) => {
      for (let i = 0; i < peerMatrix[k].length; i++) {
        let sum = 0;
        for (let j = 0; j < peerMatrix[k].length; j++) {
          sum += peerMatrix[k][j][i] ?? 0;
        }
        if (sum !== 100) {
          throw new BadRequestException(
            `Some student voting is invalid. Please check their voting in component ${format(sc.startDate, 'dd/MM/y')} - ${format(sc.endDate, 'dd/MM/y')}.`,
          );
        }
      }
    });

    const studentScores = calculateStudentGradesFromAllComponentsByWebavalia({
      peerMatrix,
      groupGrade: data.groupGrade,
      selfWeight,
      scoringComponentWeights,
    });

    const updatedScores = userIds.map((userId, i) => ({
      studentUserId: userId,
      score: parseFloat(studentScores[i].toFixed(4))!,
    }));

    await this.upsertScore({
      groupId,
      groupScore: data.groupGrade,
      studentScores: updatedScores,
    });

    return { groupId: data.groupId };
  }

  async prepareData({
    assessment,
    group,
    scoringComponents,
  }: {
    assessment: schema.Assessment;
    group: schema.Group;
    scoringComponents: schema.ScoringComponent[];
  }) {
    const groupId = group.groupId;

    const promises = scoringComponents.map(async (item) => ({
      ...item,
      peerRating:
        await this.peerRatingService.getPeerRatingsByScoringComponentId(
          item.scoringComponentId,
          groupId,
        ),
    }));

    const peerRatingList = await Promise.all(promises);

    const peerMatrix: (number | undefined)[][][] = [];

    peerRatingList.forEach((sc) => {
      const component: (number | undefined)[][] = [];
      sc.peerRating.forEach((ratee) => {
        const row: (number | undefined)[] = [];
        ratee.ratings.forEach((rater) => {
          row.push(
            assessment.modelId === AssessmentModel.QASS
              ? rater.score
                ? rater.score / 100 // convert peer rating for QASS
                : undefined
              : rater.score,
          );
        });
        component.push(row);
      });
      peerMatrix.push(component);
    });

    const sumWeights = scoringComponents.reduce(
      (prev, curr) => prev + curr.weight,
      0,
    );
    const weights = scoringComponents.map((item) => item.weight / sumWeights);

    return {
      peerMatrix,
      scoringComponentWeights: weights,
    };
  }

  async validateParameters({
    model,
    groupId,
  }: {
    model: AssessmentModel;
    groupId: number;
  }) {
    // check group exist
    const group = await this.getGroupById(groupId);

    // check model exist
    const assessment = await this.assessmentService.getAssessmentById(
      group.assessmentId,
    );

    if (!assessment?.modelId || !assessment.modelConfig) {
      throw new BadRequestException('Assessment model was not selected.');
    }
    if (model !== assessment?.modelId) {
      throw new ForbiddenException(
        'Not allow to calculate by this assessment model.',
      );
    }

    // check at least one scoring component exist
    const scoringComponents = await this.db.query.scoringComponents.findMany({
      where: eq(schema.scoringComponents.assessmentId, group.assessmentId),
    });

    if (scoringComponents.length === 0) {
      throw new BadRequestException(
        'At least one scoring component must be created. Please create scoring component and wait for peer rating to be done before proceed.',
      );
    }

    // All scoring components must be done
    scoringComponents.forEach((sc) => {
      if (new Date() < new Date(sc.endDate))
        throw new ForbiddenException(
          'All scoring components must be finished before you can calculate student scores.',
        );
    });

    return { assessment, group, scoringComponents };
  }

  async checkUserRole(
    assessmentId: schema.Assessment['assessmentId'],
    roleId: schema.User['roleId'],
  ) {
    if (roleId === parseInt(Role.Student)) {
      const scoringComponents =
        await this.assessmentService.getScoringComponentsByAssessmentId({
          assessmentId: assessmentId,
        });

      scoringComponents.forEach((comp) => {
        if (new Date() >= comp.startDate) {
          throw new ForbiddenException(
            'Cannot create or delete groups after scoring has started.',
          );
        }
      });
    }
  }

  async checkScoringComponentStarted(
    assessmentId: schema.Assessment['assessmentId'],
  ) {
    const scoringComponents =
      await this.assessmentService.getScoringComponentsByAssessmentId({
        assessmentId: assessmentId,
      });

    scoringComponents.forEach((comp) => {
      if (new Date() >= comp.startDate) {
        throw new ForbiddenException(
          'Cannot add or remove members after scoring has started.',
        );
      }
    });
  }

  async generateUniqueCode(length = 8): Promise<string> {
    const maxRetries = 5;

    for (let i = 0; i < maxRetries; i++) {
      const code = generateCode(length);

      const groups = await this.db.query.groups.findFirst({
        where: eq(schema.groups.groupCode, code),
      });

      if (!groups) {
        return code;
      }
    }

    throw new Error(
      'Failed to generate a unique group code. Please try again.',
    );
  }
}
