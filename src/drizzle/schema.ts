import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

// ========== ROLES ==========
export const roles = pgTable('roles', {
  roleId: serial('role_id').primaryKey(),
  roleName: varchar('role_name', { length: 255 }).notNull().unique(),
});

export type Role = typeof roles.$inferSelect;

// ========== USERS ==========
export const users = pgTable('users', {
  userId: serial('user_id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  roleId: integer('role_id')
    .references(() => roles.roleId)
    .notNull(),
  refreshToken: text('refreshToken'),
  createdDate: timestamp('created_date').notNull(),
  updatedDate: timestamp('updated_date'),
});

export type User = typeof users.$inferSelect;

// ========== MODELS ==========
export const models = pgTable('models', {
  modelId: serial('model_id').primaryKey(),
  modelName: varchar('model_name', { length: 255 }).notNull().unique(),
});

export type Model = typeof models.$inferSelect;

// ========== ASSESSMENTS ==========
export const assessments = pgTable('assessments', {
  assessmentId: serial('assessment_id').primaryKey(),
  assessmentName: varchar('assessment_name', { length: 255 }).notNull(),
  assessmentCode: varchar('assessment_code', { length: 255 })
    .notNull()
    .unique(),
  modelId: integer('model_id').references(() => models.modelId, {
    onDelete: 'cascade',
  }),
  modelConfig: jsonb('model_config'),
  isPublished: boolean('is_published').notNull(),
  instructorUserId: integer('instructor_user_id')
    .references(() => users.userId)
    .notNull(),
  createdDate: timestamp('created_date').notNull(),
  updatedDate: timestamp('updated_date'),
});

export type Assessment = typeof assessments.$inferSelect;

// ========== ASSESSMENT STUDENT ==========
export const assessmentStudent = pgTable(
  'assessment_student',
  {
    assessmentStudentId: serial('assessment_student_id').primaryKey(),
    assessmentId: integer('assessment_id')
      .references(() => assessments.assessmentId, { onDelete: 'cascade' })
      .notNull(),
    studentUserId: integer('student_user_id')
      .references(() => users.userId)
      .notNull(),
    isConfirmed: boolean('is_confirmed').notNull(),
    createdDate: timestamp('created_date').notNull(),
    updatedDate: timestamp('updated_date'),
  },
  (table) => [
    unique('uniqueAssessmentStudent').on(
      table.assessmentId,
      table.studentUserId,
    ),
  ],
);

export type AssessmentStudent = typeof assessmentStudent.$inferSelect;

// ========== GROUPS ==========
export const groups = pgTable('groups', {
  groupId: serial('group_id').primaryKey(),
  groupName: varchar('group_name', { length: 255 }).notNull(),
  groupCode: varchar('group_code', { length: 255 }).notNull().unique(),
  assessmentId: integer('assessment_id')
    .references(() => assessments.assessmentId, { onDelete: 'cascade' })
    .notNull(),
  createdBy: integer('created_by')
    .references(() => users.userId)
    .notNull(),
  createdDate: timestamp('created_date').notNull(),
  updatedBy: integer('updated_by').references(() => users.userId),
  updatedDate: timestamp('updated_date'),
});

export type Group = typeof groups.$inferSelect;

// ========== GROUP MEMBERS ==========
export const groupMembers = pgTable(
  'group_members',
  {
    groupMemberId: serial('group_member_id').primaryKey(),
    groupId: integer('group_id')
      .references(() => groups.groupId, {
        onDelete: 'cascade',
      })
      .notNull(),
    studentUserId: integer('student_user_id')
      .references(() => users.userId)
      .notNull(),
    assessmentId: integer('assessment_id')
      .references(() => assessments.assessmentId, { onDelete: 'cascade' })
      .notNull(),
    createdDate: timestamp('created_date').notNull(),
  },
  (table) => [
    unique('uniqueMembership').on(
      table.groupId,
      table.studentUserId,
      table.assessmentId,
    ),
  ],
);

export type GroupMember = typeof groupMembers.$inferSelect;

// ========== GROUP SCORES ==========
export const groupScores = pgTable('group_scores', {
  groupScoreId: serial('group_score_id').primaryKey(),
  groupId: integer('group_id')
    .references(() => groups.groupId, {
      onDelete: 'cascade',
    })
    .notNull(),
  score: doublePrecision('score').notNull(),
  createdDate: timestamp('created_date').notNull(),
  updatedDate: timestamp('updated_date'),
});

export type GroupScore = typeof groupScores.$inferSelect;

// ========== STUDENT SCORES ==========
export const studentScores = pgTable('student_scores', {
  studentScoreId: serial('student_score_id').primaryKey(),
  studentUserId: integer('student_user_id')
    .references(() => users.userId)
    .notNull(),
  groupId: integer('group_id')
    .references(() => groups.groupId, {
      onDelete: 'cascade',
    })
    .notNull(),
  score: integer('score').notNull(),
  remark: text('remark'),
  createdDate: timestamp('created_date').notNull(),
  updatedDate: timestamp('updated_date'),
});

export type StudentScore = typeof studentScores.$inferSelect;

// ========== SCORING COMPONENTS ==========
export const scoringComponents = pgTable('scoring_components', {
  scoringComponentId: serial('scoring_component_id').primaryKey(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  weight: integer('weight').notNull(),
  assessmentId: integer('assessment_id')
    .references(() => assessments.assessmentId, { onDelete: 'cascade' })
    .notNull(),
  createdDate: timestamp('created_date').notNull(),
});

export type ScoringComponent = typeof scoringComponents.$inferSelect;

// ========== PEER RATINGS ==========
export const peerRatings = pgTable(
  'peer_ratings',
  {
    peerRatingId: serial('peer_rating_id').primaryKey(),
    scoringComponentId: integer('scoring_component_id')
      .references(() => scoringComponents.scoringComponentId, {
        onDelete: 'cascade',
      })
      .notNull(),
    groupId: integer('group_id')
      .references(() => groups.groupId, {
        onDelete: 'cascade',
      })
      .notNull(),
    rateeStudentUserId: integer('ratee_student_user_id')
      .references(() => users.userId)
      .notNull(),
    raterStudentUserId: integer('rater_student_user_id')
      .references(() => users.userId)
      .notNull(),
    score: integer('score').notNull(),
    comment: text('comment'),
    createdDate: timestamp('created_date').notNull(),
    updatedDate: timestamp('updated_date'),
  },
  (table) => [
    unique('uniqueRaterRatee').on(
      table.scoringComponentId,
      table.rateeStudentUserId,
      table.raterStudentUserId,
    ),
  ],
);

export type PeerRating = typeof peerRatings.$inferSelect;
