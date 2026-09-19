import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { ReviewMode } from '@reviewly/shared';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  username: text('username'),
  avatarUrl: text('avatar_url'),
  totalSessions: integer('total_sessions').notNull().default(0),
  totalStudyTimeMinutes: integer('total_study_time_minutes').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('auth_sessions_user_id_idx').on(table.userId)],
);

export const modules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    content: text('content'),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    masteryScore: numeric('mastery_score', { precision: 5, scale: 2 }).notNull().default('0'),
    totalSessions: integer('total_sessions').notNull().default(0),
    aiProcessed: boolean('ai_processed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('modules_user_id_idx').on(table.userId)],
);

export const flashcards = pgTable(
  'flashcards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    difficulty: integer('difficulty').notNull().default(1),
    nextReviewAt: timestamp('next_review_at', { withTimezone: true }).defaultNow(),
    easeFactor: numeric('ease_factor', { precision: 4, scale: 2 }).notNull().default('2.5'),
    intervalDays: integer('interval_days').notNull().default(1),
    reviewCount: integer('review_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('flashcards_module_id_idx').on(table.moduleId)],
);

export const mcqQuestions = pgTable(
  'mcq_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    options: jsonb('options').$type<string[]>().notNull(),
    correctIndex: integer('correct_index').notNull(),
    explanation: text('explanation'),
    difficulty: integer('difficulty').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('mcq_questions_module_id_idx').on(table.moduleId)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    mode: text('mode').$type<ReviewMode>().notNull(),
    score: integer('score').notNull().default(0),
    totalQuestions: integer('total_questions').notNull().default(0),
    correctAnswers: integer('correct_answers').notNull().default(0),
    durationSeconds: integer('duration_seconds').notNull().default(0),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('sessions_mode_check', sql`${table.mode} in ('flashcard', 'mcq', 'speed')`),
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_module_id_idx').on(table.moduleId),
  ],
);
