import { and, eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { currentUser, requireAuth } from '../auth/guard';
import { db } from '../db/client';
import { modules, sessions, users } from '../db/schema';
import { first } from '../lib/rows';

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

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
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
