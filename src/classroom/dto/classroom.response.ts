import { Assignment, Classroom, User } from '../../drizzle/schema';
import { UserProtected } from '../../user/user.interface';

export interface CreateClassroomResponse extends Classroom {}

export interface UpdateClassroomResponse extends Classroom {}

export interface GetClassroomByIdResponse extends Classroom {}

export interface DeleteClassroomResponse {
  classroomId: Classroom['classroomId'];
}

export interface GetClassroomsByInstructorResponse extends Array<Classroom> {}

export interface GetClassroomsByStudentResponse extends Array<Classroom> {}

export interface SearchStudentsInClassroomResponse
  extends Array<UserProtected> {}

export interface RemoveStudentFromClassroomResponse {
  studentUserId: User['userId'];
}

export interface GetAssignmentsByClassroomIdResponse
  extends Array<Assignment> {}

export interface JoinClassroomResponse {
  classroomId: Classroom['classroomId'];
}
