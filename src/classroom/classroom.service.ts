import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from '../drizzle/schema';
import { UserService } from '../user/user.service';
import {
  CreateClassroomRequest,
  UpdateClassroomRequest,
} from './dto/classroom.request';
import {
  CreateClassroomResponse,
  DeleteClassroomResponse,
  GetClassroomByIdResponse,
  GetClassroomsByInstructorResponse,
  GetClassroomsByStudentResponse,
  GetStudentsInClassroomResponse,
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
    const classroom = await this.db.query.classrooms.findFirst({
      where: eq(schema.classrooms.classroomId, classroomId),
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom not found`);
    }

    return classroom;
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
    return await this.db
      .select()
      .from(schema.classrooms)
      .where(eq(schema.classrooms.instructorUserId, instructorUserId));
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
      .where(eq(schema.enrollments.studentUserId, studentUserId));
    return result.map((row) => row.classrooms);
  }

  async getStudentsInClassroom(
    classroomId: schema.Classroom['classroomId'],
  ): Promise<GetStudentsInClassroomResponse> {
    await this.getClassroomById(classroomId);

    const result = await this.db
      .select()
      .from(schema.enrollments)
      .innerJoin(
        schema.users,
        eq(schema.enrollments.studentUserId, schema.users.userId),
      )
      .where(eq(schema.enrollments.classroomId, classroomId));

    const student = result.map((row) => ({
      ...row.users,
      password: undefined,
      refreshToken: undefined,
    }));

    return student;
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
  ) {
    return await this.db
      .select()
      .from(schema.assignments)
      .where(eq(schema.assignments.classroomId, classroomId));
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

    const existing = await this.db.query.enrollments.findFirst({
      where: (enrollment) =>
        eq(enrollment.classroomId, classroom.classroomId) &&
        eq(enrollment.studentUserId, studentUserId),
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

  generateCode(length = 8): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }

  async generateUniqueCode(length = 8): Promise<string> {
    const maxRetries = 5;

    for (let i = 0; i < maxRetries; i++) {
      const code = this.generateCode(length);

      const exists = await this.db
        .select()
        .from(schema.classrooms)
        .where(eq(schema.classrooms.classroomCode, code))
        .limit(1);

      if (exists.length === 0) {
        return code;
      }
    }

    throw new Error(
      'Failed to generate a unique classroom code. Please try again.',
    );
  }
}
