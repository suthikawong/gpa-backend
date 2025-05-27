import {
  boolean,
  integer,
  jsonb,
  pgTable,
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

// ========== INSTITUTE ==========
export const institutes = pgTable('institutes', {
  instituteId: serial('institute_id').primaryKey(),
  instituteName: varchar('institute_name', { length: 255 }).notNull(),
  createdBy: integer('created_by').notNull(),
  createdDate: timestamp('created_date').notNull(),
  updatedBy: integer('updated_by'),
  updatedDate: timestamp('updated_date'),
});

export type Institute = typeof institutes.$inferSelect;

// ========== ROLE ==========
export const roles = pgTable('roles', {
  roleId: serial('role_id').primaryKey(),
  roleName: varchar('role_name', { length: 100 }).notNull(),
});

export type Role = typeof roles.$inferSelect;

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
  instituteId: integer('institute_id')
    .references(() => institutes.instituteId)
    .notNull(),
  createdDate: timestamp('created_date').notNull(),
  updatedDate: timestamp('updated_date'),
});

export type Classroom = typeof classrooms.$inferSelect;

// ========== ENROLLMENTS ==========
export const enrollments = pgTable('enrollments', {
  enrollmentId: serial('enrollment_id').primaryKey(),
  studentUserId: integer('student_user_id')
    .references(() => users.userId)
    .notNull(),
  classroomId: integer('classroom_id')
    .references(() => classrooms.classroomId, { onDelete: 'cascade' })
    .notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;

// ========== MODEL ==========
export const models = pgTable('models', {
  modelId: serial('model_id').primaryKey(),
  modelName: varchar('model_name', { length: 255 }).notNull(),
});

export type Model = typeof models.$inferSelect;

// ========== MODEL_CONFIGURATION ==========
export const modelConfigurations = pgTable('model_configurations', {
  modelConfigurationId: serial('model_configuration_id').primaryKey(),
  modelId: integer('model_id')
    .references(() => models.modelId)
    .notNull(),
  config: jsonb('config'),
});

export type ModelConfiguration = typeof modelConfigurations.$inferSelect;

// ========== ASSIGNMENT ==========
export const assignments = pgTable('assignments', {
  assignmentId: serial('assignment_id').primaryKey(),
  assignmentName: varchar('assignment_name', { length: 255 }).notNull(),
  modelConfigurationId: integer('model_configuration_id').references(
    () => modelConfigurations.modelConfigurationId,
  ),
  isPublished: boolean('is_published').notNull(),
  dueDate: timestamp('due_date').notNull(),
  classroomId: integer('classroom_id')
    .references(() => classrooms.classroomId, { onDelete: 'cascade' })
    .notNull(),
  createdDate: timestamp('created_date').notNull(),
  updatedDate: timestamp('updated_date'),
});

export type Assignment = typeof assignments.$inferSelect;

// ========== GROUP ==========
export const groups = pgTable('groups', {
  groupId: serial('group_id').primaryKey(),
  groupName: varchar('group_name', { length: 255 }).notNull(),
  groupCode: varchar('group_code', { length: 100 }).notNull(),
  assignmentId: integer('assignment_id')
    .references(() => assignments.assignmentId, { onDelete: 'cascade' })
    .notNull(),
});

export type Group = typeof groups.$inferSelect;

// ========== GROUP_MEMBER ==========
export const groupMembers = pgTable('group_members', {
  groupMemberId: serial('group_member_id').primaryKey(),
  groupId: integer('group_id')
    .references(() => groups.groupId, { onDelete: 'cascade' })
    .notNull(),
  studentUserId: integer('student_user_id')
    .references(() => users.userId)
    .notNull(),
});

export type GroupMember = typeof groupMembers.$inferSelect;

// ========== CRITERIA ==========
export const criteria = pgTable('criteria', {
  criterionId: serial('criterion_id').primaryKey(),
  criterionName: varchar('criterion_name', { length: 255 }).notNull(),
  assignmentId: integer('assignment_id')
    .references(() => assignments.assignmentId, { onDelete: 'cascade' })
    .notNull(),
  percentage: integer('percentage').notNull(),
  displayOrder: integer('display_order').notNull(),
});

export type Criterion = typeof criteria.$inferSelect;

// ========== ASSESSMENT PERIOD ==========
export const assessmentPeriods = pgTable('assessment_periods', {
  assessmentPeriodId: serial('assessment_period_id').primaryKey(),
  assessStartDate: timestamp('assess_start_date').notNull(),
  assessEndDate: timestamp('assess_end_date').notNull(),
  weight: integer('weight').notNull(),
  assignmentId: integer('assignment_id')
    .references(() => assignments.assignmentId, { onDelete: 'cascade' })
    .notNull(),
});

export type AssessmentPeriod = typeof assessmentPeriods.$inferSelect;

// ========== GROUP_MARK ==========
export const groupMarks = pgTable('group_marks', {
  groupMarkId: serial('group_mark_id').primaryKey(),
  criterionId: integer('criterion_id')
    .references(() => criteria.criterionId)
    .notNull(),
  groupId: integer('group_id')
    .references(() => groups.groupId, { onDelete: 'cascade' })
    .notNull(),
  mark: integer('mark').notNull(),
});

export type GroupMark = typeof groupMarks.$inferSelect;

// ========== STUDENT_MARK ==========
export const studentMarks = pgTable('student_marks', {
  studentMarkId: serial('student_mark_id').primaryKey(),
  assignmentId: integer('assignment_id')
    .references(() => assignments.assignmentId, { onDelete: 'cascade' })
    .notNull(),
  studentUserId: integer('student_user_id')
    .references(() => users.userId)
    .notNull(),
  mark: integer('mark').notNull(),
});

export type StudentMark = typeof studentMarks.$inferSelect;

// ========== QUESTION ==========
export const questions = pgTable('questions', {
  questionId: serial('question_id').primaryKey(),
  question: text('question').notNull(),
  assessmentPeriodId: integer('assessment_period_id')
    .references(() => assessmentPeriods.assessmentPeriodId, {
      onDelete: 'cascade',
    })
    .notNull(),
  displayOrder: integer('display_order').notNull(),
});

export type Question = typeof questions.$inferSelect;

// ========== PEER_ASSESSMENT ==========
export const peerAssessments = pgTable('peer_assessments', {
  peerAssessmentId: serial('peer_assessment_id').primaryKey(),
  assignmentId: integer('assignment_id')
    .references(() => assignments.assignmentId, { onDelete: 'cascade' })
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

export type PeerAssessment = typeof peerAssessments.$inferSelect;
