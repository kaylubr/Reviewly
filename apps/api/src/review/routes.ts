import type { FlashcardDto, McqQuestionDto } from '@reviewly/shared';
import { and, asc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { currentUser, requireAuth } from '../auth/guard';
import { db } from '../db/client';
import { flashcards, mcqQuestions, modules } from '../db/schema';
import { shuffled } from '../lib/shuffle';

const MCQ_SELECTION_LIMIT = 10;
const SPEED_FETCH_LIMIT = 15;
const SPEED_SELECTION_LIMIT = 10;
const MAX_MCQ_COUNT = 50;

function toFlashcardDto(row: typeof flashcards.$inferSelect): FlashcardDto {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    difficulty: row.difficulty,
  };
}

function toQuestionDto(row: typeof mcqQuestions.$inferSelect): McqQuestionDto {
  return {
    id: row.id,
    question: row.question,
    options: row.options,
    correctIndex: row.correctIndex,
    explanation: row.explanation,
    difficulty: row.difficulty,
  };
}

async function userOwnsModule(moduleId: string, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: modules.id })
    .from(modules)
    .where(and(eq(modules.id, moduleId), eq(modules.userId, userId)))
    .limit(1);

  return rows.length > 0;
}

function parseCount(raw: unknown): number {
  const parsed = Number.parseInt(String(raw ?? MCQ_SELECTION_LIMIT), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return MCQ_SELECTION_LIMIT;
  }

  return Math.min(parsed, MAX_MCQ_COUNT);
}

export async function reviewRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { id: string } }>(
    '/api/modules/:id/flashcards',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = currentUser(request);

      if (!(await userOwnsModule(request.params.id, user.id))) {
        return reply.code(404).send({ error: 'Module not found' });
      }

      const rows = await db
        .select()
        .from(flashcards)
        .where(eq(flashcards.moduleId, request.params.id))
        .orderBy(asc(flashcards.difficulty));

      return { flashcards: rows.map(toFlashcardDto) };
    },
  );

  app.get<{ Params: { id: string }; Querystring: { count?: string } }>(
    '/api/modules/:id/mcq',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = currentUser(request);

      if (!(await userOwnsModule(request.params.id, user.id))) {
        return reply.code(404).send({ error: 'Module not found' });
      }

      const rows = await db
        .select()
        .from(mcqQuestions)
        .where(eq(mcqQuestions.moduleId, request.params.id))
        .limit(parseCount(request.query.count));

      return { questions: shuffled(rows).map(toQuestionDto) };
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/modules/:id/speed',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = currentUser(request);

      if (!(await userOwnsModule(request.params.id, user.id))) {
        return reply.code(404).send({ error: 'Module not found' });
      }

      const rows = await db
        .select()
        .from(mcqQuestions)
        .where(eq(mcqQuestions.moduleId, request.params.id))
        .limit(SPEED_FETCH_LIMIT);

      return {
        questions: shuffled(rows)
          .slice(0, SPEED_SELECTION_LIMIT)
          .map(toQuestionDto),
      };
    },
  );
}
