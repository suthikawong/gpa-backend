import { Assignment, Classroom, Institute, User } from '../../drizzle/schema';
import { UserProtected } from '../../user/user.interface';

export interface ClassroomWithInstitute extends Classroom {
  institute: Institute;
}

export interface ClassroomWithInstructor extends ClassroomWithInstitute {
  instructor: User;
}

export interface GetClassroomByIdResponse extends ClassroomWithInstructor {}

export interface CreateClassroomResponse extends Classroom {}

export interface UpdateClassroomResponse extends Classroom {}

export interface DeleteClassroomResponse {
  classroomId: Classroom['classroomId'];
}

export interface GetClassroomsByInstructorResponse
  extends Array<ClassroomWithInstitute> {}

export interface GetClassroomsByStudentResponse
  extends Array<ClassroomWithInstitute> {}

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
