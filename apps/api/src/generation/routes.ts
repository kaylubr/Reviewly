import { and, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { currentUser, requireAuth } from '../auth/guard';
import { db } from '../db/client';
import { flashcards, mcqQuestions, modules } from '../db/schema';
import { capContent } from './prompt';
import { GenerationError, type QuestionGenerator } from './types';

export function createGenerateRoutes(generator: QuestionGenerator) {
  return async function generateRoutes(app: FastifyInstance): Promise<void> {
    app.post<{ Params: { id: string } }>(
      '/api/modules/:id/generate',
      { preHandler: requireAuth },
      async (request, reply) => {
        const user = currentUser(request);

        const rows = await db
          .select()
          .from(modules)
          .where(and(eq(modules.id, request.params.id), eq(modules.userId, user.id)))
          .limit(1);

        const module = rows[0];

        if (!module) {
          return reply.code(404).send({ error: 'Module not found' });
        }

        const content = module.content?.trim();

        if (!content) {
          return reply
            .code(422)
            .send({ error: 'This module has no content to generate questions from' });
        }

        let studySet;

        try {
          studySet = await generator(capContent(content));
        } catch (error) {
          if (error instanceof GenerationError) {
            return reply.code(502).send({ error: error.message });
          }
          throw error;
        }

        await db.transaction(async (transaction) => {
          await transaction.delete(flashcards).where(eq(flashcards.moduleId, module.id));
          await transaction.delete(mcqQuestions).where(eq(mcqQuestions.moduleId, module.id));

          if (studySet.flashcards.length > 0) {
            await transaction.insert(flashcards).values(
              studySet.flashcards.map((card) => ({
                moduleId: module.id,
                question: card.question,
                answer: card.answer,
                difficulty: card.difficulty,
              })),
            );
          }

          if (studySet.questions.length > 0) {
            await transaction.insert(mcqQuestions).values(
              studySet.questions.map((question) => ({
                moduleId: module.id,
                question: question.question,
                options: question.options,
                correctIndex: question.correctIndex,
                explanation: question.explanation,
                difficulty: question.difficulty,
              })),
            );
          }

          await transaction
            .update(modules)
            .set({
              aiProcessed: true,
              description: studySet.summary || module.description,
              updatedAt: new Date(),
            })
            .where(eq(modules.id, module.id));
        });

        return {
          flashcardCount: studySet.flashcards.length,
          questionCount: studySet.questions.length,
          summary: studySet.summary,
        };
      },
    );
  };
}
