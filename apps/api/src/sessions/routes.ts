import { and, desc, eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { currentUser, requireAuth } from '../auth/guard';
import { db } from '../db/client';
import { modules, sessions, users } from '../db/schema';
import { first } from '../lib/rows';

const DEFAULT_HISTORY_LIMIT = 100;
const MAX_HISTORY_LIMIT = 500;

const completeBody = z
  .object({
    moduleId: z.uuid(),
    mode: z.enum(['flashcard', 'mcq', 'speed']),
    correctAnswers: z.number().int().min(0),
    totalQuestions: z.number().int().min(0),
    durationSeconds: z.number().int().min(0),
  })
  .refine((body) => body.correctAnswers <= body.totalQuestions, {
    message: 'correctAnswers cannot exceed totalQuestions',
  });

function parseLimit(raw: unknown): number {
  const parsed = Number.parseInt(String(raw ?? DEFAULT_HISTORY_LIMIT), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_HISTORY_LIMIT;
  }

  return Math.min(parsed, MAX_HISTORY_LIMIT);
}

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { limit?: string } }>(
    '/api/sessions/history',
    { preHandler: requireAuth },
    async (request) => {
      const user = currentUser(request);

      const rows = await db
        .select({
          id: sessions.id,
          mode: sessions.mode,
          score: sessions.score,
          correctAnswers: sessions.correctAnswers,
          totalQuestions: sessions.totalQuestions,
          durationSeconds: sessions.durationSeconds,
          completedAt: sessions.completedAt,
          moduleTitle: modules.title,
        })
        .from(sessions)
        .leftJoin(modules, eq(modules.id, sessions.moduleId))
        .where(eq(sessions.userId, user.id))
        .orderBy(desc(sessions.completedAt))
        .limit(parseLimit(request.query.limit));

      return {
        sessions: rows.map((row) => ({
          ...row,
          completedAt: row.completedAt.toISOString(),
        })),
      };
    },
  );

  app.post('/api/sessions/complete', { preHandler: requireAuth }, async (request, reply) => {
    const user = currentUser(request);
    const body = completeBody.parse(request.body);

    const owned = await db
      .select({ id: modules.id })
      .from(modules)
      .where(and(eq(modules.id, body.moduleId), eq(modules.userId, user.id)))
      .limit(1);

    if (owned.length === 0) {
      return reply.code(404).send({ error: 'Module not found' });
    }

    const score =
      body.totalQuestions > 0
        ? Math.round((body.correctAnswers / body.totalQuestions) * 100)
        : 0;

    const result = await db.transaction(async (transaction) => {
      const inserted = await transaction
        .insert(sessions)
        .values({
          userId: user.id,
          moduleId: body.moduleId,
          mode: body.mode,
          score,
          totalQuestions: body.totalQuestions,
          correctAnswers: body.correctAnswers,
          durationSeconds: body.durationSeconds,
        })
        .returning({ id: sessions.id });

      const sessionId = first(inserted).id;

      const moduleSessions = await transaction
        .select({ score: sessions.score })
        .from(sessions)
        .where(eq(sessions.moduleId, body.moduleId));

      const masteryScore = Math.round(
        moduleSessions.reduce((total, row) => total + row.score, 0) / moduleSessions.length,
      );

      await transaction
        .update(modules)
        .set({
          masteryScore: masteryScore.toFixed(2),
          totalSessions: moduleSessions.length,
          updatedAt: new Date(),
        })
        .where(eq(modules.id, body.moduleId));

      await transaction
        .update(users)
        .set({
          totalSessions: sql`${users.totalSessions} + 1`,
          totalStudyTimeMinutes: sql`${users.totalStudyTimeMinutes} + ${Math.floor(
            body.durationSeconds / 60,
          )}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return { sessionId, masteryScore, moduleTotalSessions: moduleSessions.length };
    });

    return {
      sessionId: result.sessionId,
      score,
      moduleTotalSessions: result.moduleTotalSessions,
      masteryScore: result.masteryScore,
    };
  });
}
