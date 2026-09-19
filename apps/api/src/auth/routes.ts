import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client';
import { users } from '../db/schema';
import { first } from '../lib/rows';
import { clearSessionCookie, SESSION_COOKIE, setSessionCookie } from './cookies';
import { currentUser, requireAuth } from './guard';
import { hashPassword, verifyPassword } from './passwords';
import { endSession, startSession } from './sessions';
import { publicUserColumns } from './users';

const signUpBody = z.object({
  email: z.email(),
  password: z.string().min(6),
  username: z.string().trim().min(1).max(60).optional(),
});

const signInBody = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/sign-up', async (request, reply) => {
    const body = signUpBody.parse(request.body);
    const email = body.email.trim().toLowerCase();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return reply.code(409).send({ error: 'That email is already registered' });
    }

    const created = await db
      .insert(users)
      .values({
        email,
        passwordHash: await hashPassword(body.password),
        username: body.username ?? null,
      })
      .returning(publicUserColumns);

    const user = first(created);
    const { token, expiresAt } = await startSession(user.id);
    setSessionCookie(reply, token, expiresAt);

    return reply.code(201).send({ user });
  });

  app.post('/api/auth/sign-in', async (request, reply) => {
    const body = signInBody.parse(request.body);
    const email = body.email.trim().toLowerCase();

    const found = await db
      .select({ ...publicUserColumns, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const row = found[0];

    if (!row) {
      return reply.code(401).send({ error: 'Incorrect email or password' });
    }

    const { passwordHash, ...user } = row;

    if (!(await verifyPassword(body.password, passwordHash))) {
      return reply.code(401).send({ error: 'Incorrect email or password' });
    }

    const { token, expiresAt } = await startSession(user.id);
    setSessionCookie(reply, token, expiresAt);

    return reply.send({ user });
  });

  app.post('/api/auth/sign-out', async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];

    if (token) {
      await endSession(token);
    }

    clearSessionCookie(reply);
    return reply.code(204).send();
  });

  app.get('/api/auth/me', { preHandler: requireAuth }, async (request) => ({
    user: currentUser(request),
  }));
}
