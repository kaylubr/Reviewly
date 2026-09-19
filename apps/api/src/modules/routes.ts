import type { ModuleDetailDto, ModuleDto } from '@reviewly/shared';
import { and, desc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { currentUser, requireAuth } from '../auth/guard';
import { db } from '../db/client';
import { flashcards, mcqQuestions, modules } from '../db/schema';
import { first } from '../lib/rows';

const createBody = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  content: z.string().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
});

type ModuleRow = typeof modules.$inferSelect;

function toModuleDto(row: ModuleRow): ModuleDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    tags: row.tags,
    masteryScore: Number(row.masteryScore),
    totalSessions: row.totalSessions,
    aiProcessed: row.aiProcessed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function moduleRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/modules', { preHandler: requireAuth }, async (request) => {
    const user = currentUser(request);

    const rows = await db
      .select()
      .from(modules)
      .where(eq(modules.userId, user.id))
      .orderBy(desc(modules.updatedAt));

    return { modules: rows.map(toModuleDto) };
  });

  app.get<{ Params: { id: string } }>(
    '/api/modules/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = currentUser(request);

      const rows = await db
        .select()
        .from(modules)
        .where(and(eq(modules.id, request.params.id), eq(modules.userId, user.id)))
        .limit(1);

      const row = rows[0];

      if (!row) {
        return reply.code(404).send({ error: 'Module not found' });
      }

      const [flashcardCount, questionCount] = await Promise.all([
        db.$count(flashcards, eq(flashcards.moduleId, row.id)),
        db.$count(mcqQuestions, eq(mcqQuestions.moduleId, row.id)),
      ]);

      const module: ModuleDetailDto = { ...toModuleDto(row), flashcardCount, questionCount };

      return { module };
    },
  );

  app.post('/api/modules', { preHandler: requireAuth }, async (request, reply) => {
    const user = currentUser(request);
    const body = createBody.parse(request.body);

    const created = await db
      .insert(modules)
      .values({
        userId: user.id,
        title: body.title,
        description: body.description ?? null,
        content: body.content?.trim() ? body.content : null,
        tags: body.tags ?? [],
      })
      .returning();

    return reply.code(201).send({ module: toModuleDto(first(created)) });
  });

  app.delete<{ Params: { id: string } }>(
    '/api/modules/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = currentUser(request);

      const deleted = await db
        .delete(modules)
        .where(and(eq(modules.id, request.params.id), eq(modules.userId, user.id)))
        .returning({ id: modules.id });

      if (deleted.length === 0) {
        return reply.code(404).send({ error: 'Module not found' });
      }

      return reply.code(204).send();
    },
  );
}
