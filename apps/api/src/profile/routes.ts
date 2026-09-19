import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { currentUser, requireAuth } from '../auth/guard';
import { publicUserColumns } from '../auth/users';
import { db } from '../db/client';
import { users } from '../db/schema';
import { first } from '../lib/rows';

const updateBody = z.object({
  username: z.string().trim().min(1).max(60),
});

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  app.patch('/api/profile', { preHandler: requireAuth }, async (request) => {
    const user = currentUser(request);
    const body = updateBody.parse(request.body);

    const updated = await db
      .update(users)
      .set({ username: body.username, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning(publicUserColumns);

    return { user: first(updated) };
  });
}
