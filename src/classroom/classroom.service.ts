import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, ilike } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Role } from '../app.config';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { UserService } from '../user/user.service';
import { generateCode } from '../utils/generate-code';
import {
  CreateClassroomRequest,
  SearchStudentsInClassroomRequest,
  UpdateClassroomRequest,
} from './dto/classroom.request';
import {
  CreateClassroomResponse,
  DeleteClassroomResponse,
  GetClassroomByIdResponse,
  GetClassroomsByInstructorResponse,
  GetClassroomsByStudentResponse,
  SearchStudentsInClassroomResponse,
  UpdateClassroomResponse,
} from './dto/classroom.response';

@Injectable()
export class ClassroomService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private readonly userService: UserService,
  ) {}

  async getClassroomById(
    classroomId: schema.Classroom['classroomId'],
  ): Promise<GetClassroomByIdResponse> {
    const [result] = await this.db
      .select()
      .from(schema.classrooms)
      .innerJoin(
        schema.institutes,
        eq(schema.institutes.instituteId, schema.classrooms.instituteId),
      )
      .innerJoin(
        schema.users,
        eq(schema.users.userId, schema.classrooms.instructorUserId),
      )
      .where(eq(schema.classrooms.classroomId, classroomId))
      .limit(1);

    if (!result) {
      throw new NotFoundException(`Classroom not found`);
    }

    return {
      ...result.classrooms,
      institute: result.institutes,
      instructor: result.users,
    };
  }

  async create(
    data: CreateClassroomRequest,
    instructorUserId: schema.Classroom['instructorUserId'],
  ): Promise<CreateClassroomResponse> {
    const now = new Date();
    const { classroomName, instituteId } = data;

    const classroomCode = await this.generateUniqueCode();
    const isActive = false;

    const institute = await this.db.query.institutes.findFirst({
      where: eq(schema.classrooms.instituteId, instituteId),
    });
    if (!institute) {
      throw new NotFoundException('Institute not found');
    }

    const result = await this.db
      .insert(schema.classrooms)
      .values({
        classroomName,
        classroomCode,
        isActive,
        instructorUserId,
        instituteId,
        createdDate: now,
      })
      .returning();

    return result[0];
  }

  async update(data: UpdateClassroomRequest): Promise<UpdateClassroomResponse> {
    const { classroomId, ...updateData } = data;

    await this.getClassroomById(classroomId);

    const institute = await this.db.query.institutes.findFirst({
      where: eq(schema.classrooms.instituteId, updateData.instituteId),
    });
    if (!institute) {
      throw new NotFoundException('Institute not found');
    }

    const now = new Date();

    const result = await this.db
      .update(schema.classrooms)
      .set({
        ...updateData,
        updatedDate: now,
      })
      .where(eq(schema.classrooms.classroomId, classroomId))
      .returning();

    return result[0];
  }

  async delete(
    classroomId: schema.Classroom['classroomId'],
  ): Promise<DeleteClassroomResponse> {
    await this.getClassroomById(classroomId);

    await this.db
      .delete(schema.classrooms)
      .where(eq(schema.classrooms.classroomId, classroomId));

    return { classroomId };
  }

  async getClassroomsByInstructor(
    instructorUserId: schema.Classroom['instructorUserId'],
  ): Promise<GetClassroomsByInstructorResponse> {
    const result = await this.db
      .select()
      .from(schema.classrooms)
      .innerJoin(
        schema.institutes,
        eq(schema.institutes.instituteId, schema.classrooms.instituteId),
      )
      .where(eq(schema.classrooms.instructorUserId, instructorUserId));
    return result.map((item) => ({
      ...item.classrooms,
      institute: item.institutes,
    }));
  }

  async getByStudentId(
    studentUserId: schema.User['userId'],
  ): Promise<GetClassroomsByStudentResponse> {
    const result = await this.db
      .select()
      .from(schema.enrollments)
      .innerJoin(
        schema.classrooms,
        eq(schema.enrollments.classroomId, schema.classrooms.classroomId),
      )
      .innerJoin(
        schema.institutes,
        eq(schema.institutes.instituteId, schema.classrooms.instituteId),
      )
      .where(eq(schema.enrollments.studentUserId, studentUserId));
    return result.map((item) => ({
      ...item.classrooms,
      institute: item.institutes,
    }));
  }

  async searchStudentsInClassroom(
    data: SearchStudentsInClassroomRequest,
  ): Promise<{ students: SearchStudentsInClassroomResponse; total: number }> {
    await this.getClassroomById(data.classroomId);

    const condition = [eq(schema.enrollments.classroomId, data.classroomId)];

    if (data.name) {
      condition.push(ilike(schema.users.name, `%${data.name}%`));
    }

    const query = this.db
      .select({
        userId: schema.users.userId,
        name: schema.users.name,
        email: schema.users.email,
        roleId: schema.users.roleId,
      })
      .from(schema.enrollments)
      .innerJoin(
        schema.users,
        eq(schema.enrollments.studentUserId, schema.users.userId),
      )
      .where(and(...condition));

    if (data.limit !== undefined && data.offset !== undefined) {
      query.limit(data.limit).offset(data.offset);
    }

    const students = await query;

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.enrollments)
      .innerJoin(
        schema.users,
        eq(schema.enrollments.studentUserId, schema.users.userId),
      )
      .where(and(...condition))
      .limit(1);

    return { students, total };
  }

  async removeStudentFromClassroom(
    classroomId: schema.Classroom['classroomId'],
    studentUserId: schema.User['userId'],
  ) {
    await this.getClassroomById(classroomId);
    await this.userService.getUserById(studentUserId);

    await this.db
      .delete(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.classroomId, classroomId),
          eq(schema.enrollments.studentUserId, studentUserId),
        ),
      );

    return { studentUserId };
  }

  async getAssignmentsByClassroomId(
    classroomId: schema.Classroom['classroomId'],
    roleId: schema.User['roleId'],
  ) {
    const conditions = [eq(schema.assignments.classroomId, classroomId)];
    if (roleId === parseInt(Role.Student)) {
      conditions.push(eq(schema.assignments.isPublished, true));
    }

    return await this.db
      .select()
      .from(schema.assignments)
      .where(and(...conditions));
  }

  async joinClassroom(
    studentUserId: schema.User['userId'],
    classroomCode: schema.Classroom['classroomCode'],
  ) {
    const classroom = await this.db.query.classrooms.findFirst({
      where: eq(schema.classrooms.classroomCode, classroomCode),
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    if (!classroom.isActive) {
      throw new ForbiddenException(`Inactive classroom cannot be joined`);
    }

    const existing = await this.db.query.enrollments.findFirst({
      where: (enrollment) =>
        and(
          eq(enrollment.classroomId, classroom.classroomId),
          eq(enrollment.studentUserId, studentUserId),
        ),
    });

    if (existing) {
      throw new ConflictException('Student already joined this classroom');
    }

    await this.db.insert(schema.enrollments).values({
      classroomId: classroom.classroomId,
      studentUserId,
    });

    return { classroomId: classroom.classroomId };
  }

  async generateUniqueCode(length = 8): Promise<string> {
    const maxRetries = 5;

    for (let i = 0; i < maxRetries; i++) {
      const code = generateCode(length);

      const classroom = await this.db.query.classrooms.findFirst({
        where: eq(schema.classrooms.classroomCode, code),
      });

      if (!classroom) {
        return code;
      }
    }

    throw new Error(
      'Failed to generate a unique classroom code. Please try again.',
    );
  }
}
