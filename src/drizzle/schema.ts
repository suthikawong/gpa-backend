import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const cats = pgTable('cats', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  breed: varchar({ length: 255 }).notNull(),
});

// export const users = pgTable('users', {
//   id: uuid().primaryKey().defaultRandom(),
//   email: varchar({ length: 255 }).notNull(),
//   password: varchar({ length: 255 }).notNull(),
//   refreshToken: text(),
// });

// ========== INSTITUTE ==========
export const institutes = pgTable('institutes', {
  instituteId: serial('institute_id').primaryKey(),
  instituteName: varchar('institute_name', { length: 255 }).notNull(),
  createdBy: integer('created_by').notNull(),
  createdDate: timestamp('created_date').notNull(),
  updatedBy: integer('updated_by'),
  updatedDate: timestamp('updated_date'),
});

// ========== ROLE ==========
export const roles = pgTable('roles', {
  roleId: serial('role_id').primaryKey(),
  roleName: varchar('role_name', { length: 100 }).notNull(),
});

// ========== USER ==========
export const users = pgTable('users', {
  userId: serial('user_id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  roleId: integer('role_id')
    .references(() => roles.roleId)
    .notNull(),
  refreshToken: text('refresh_token'),
});

export type User = typeof users.$inferSelect;

// ========== CLASSROOM ==========
export const classrooms = pgTable('classrooms', {
  classroomId: serial('classroom_id').primaryKey(),
  classroomName: varchar('classroom_name', { length: 255 }).notNull(),
  classroomCode: varchar('classroom_code', { length: 100 }).notNull(),
  isActive: boolean('is_active').notNull(),
  instructorUserId: integer('instructor_user_id')
    .references(() => users.userId)
    .notNull(),
  createdDate: timestamp('created_date').notNull(),
  updatedDate: timestamp('updated_date'),
});

// ========== JOIN_CLASSROOM ==========
export const joinClassroom = pgTable(
  'join_classroom',
  {
    studentUserId: integer('student_user_id')
      .references(() => users.userId)
      .notNull(),
    classroomId: integer('classroom_id')
      .references(() => classrooms.classroomId)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.studentUserId, table.classroomId] }),
  ],
);

// ========== MODEL ==========
export const models = pgTable('models', {
  modelId: serial('model_id').primaryKey(),
  modelName: varchar('model_name', { length: 255 }).notNull(),
});

// ========== MODEL_CONFIGURATION ==========
export const modelConfiguration = pgTable('model_configuration', {
  modelConfigurationId: serial('model_configuration_id').primaryKey(),
  modelId: integer('model_id')
    .references(() => models.modelId)
    .notNull(),
  config: jsonb('config'),
});

// ========== ASSIGNMENT ==========
export const assignments = pgTable('assignments', {
  assignmentId: serial('assignment_id').primaryKey(),
  assignmentName: varchar('assignment_name', { length: 255 }).notNull(),
  modelConfigurationId: integer('model_configuration_id')
    .references(() => modelConfiguration.modelConfigurationId)
    .notNull(),
  isPublished: boolean('is_published').notNull(),
  dueDate: timestamp('due_date').notNull(),
  assessStartDate: timestamp('assess_start_date').notNull(),
  assessEndDate: timestamp('assess_end_date').notNull(),
  classroomId: integer('classroom_id')
    .references(() => classrooms.classroomId)
    .notNull(),
  createdDate: timestamp('created_date').notNull(),
  updatedDate: timestamp('updated_date'),
});

// ========== GROUP ==========
export const groups = pgTable('groups', {
  groupId: serial('group_id').primaryKey(),
  groupName: varchar('group_name', { length: 255 }).notNull(),
  groupCode: varchar('group_code', { length: 100 }).notNull(),
  assignmentId: integer('assignment_id')
    .references(() => assignments.assignmentId)
    .notNull(),
});

// ========== GROUP_MEMBER ==========
export const groupMember = pgTable(
  'group_member',
  {
    groupId: integer('group_id')
      .references(() => groups.groupId)
      .notNull(),
    studentUserId: integer('student_user_id')
      .references(() => users.userId)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.studentUserId] })],
);

// ========== GRADING_CRITERIA ==========
export const gradingCriteria = pgTable('grading_criteria', {
  criteriaId: serial('criteria_id').primaryKey(),
  criteriaName: varchar('criteria_name', { length: 255 }).notNull(),
  assignmentId: integer('assignment_id')
    .references(() => assignments.assignmentId)
    .notNull(),
  portion: integer('portion').notNull(),
  displayOrder: integer('display_order').notNull(),
});

// ========== GROUP_MARK ==========
export const groupMarks = pgTable(
  'group_marks',
  {
    criteriaId: integer('criteria_id')
      .references(() => gradingCriteria.criteriaId)
      .notNull(),
    groupId: integer('group_id')
      .references(() => groups.groupId)
      .notNull(),
    mark: integer('mark').notNull(),
  },
  (table) => [primaryKey({ columns: [table.criteriaId, table.groupId] })],
);

// ========== FINAL_MARK ==========
export const finalMarks = pgTable(
  'final_marks',
  {
    assignmentId: integer('assignment_id')
      .references(() => assignments.assignmentId)
      .notNull(),
    studentUserId: integer('student_user_id')
      .references(() => users.userId)
      .notNull(),
    mark: integer('mark').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.assignmentId, table.studentUserId] }),
  ],
);

// ========== QUESTION ==========
export const questions = pgTable('questions', {
  questionId: serial('question_id').primaryKey(),
  question: text('question').notNull(),
  assignmentId: integer('assignment_id')
    .references(() => assignments.assignmentId)
    .notNull(),
  displayOrder: integer('display_order').notNull(),
});

// ========== PEER_ASSESSMENT ==========
export const peerAssessment = pgTable('peer_assessment', {
  peerAssessmentId: serial('peer_assessment_id').primaryKey(),
  assignmentId: integer('assignment_id')
    .references(() => assignments.assignmentId)
    .notNull(),
  assessedStudentUserId: integer('assessed_student_user_id')
    .references(() => users.userId)
    .notNull(),
  assessorStudentUserId: integer('assessor_student_user_id')
    .references(() => users.userId)
    .notNull(),
  questionId: integer('question_id')
    .references(() => questions.questionId)
    .notNull(),
  score: integer('score').notNull(),
  createdDate: timestamp('created_date').notNull(),
});
