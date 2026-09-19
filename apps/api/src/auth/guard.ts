import type { FastifyReply, FastifyRequest } from 'fastify';
import { SESSION_COOKIE } from './cookies';
import { userForSessionToken } from './sessions';
import type { PublicUser } from './users';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = request.cookies[SESSION_COOKIE];

  if (!token) {
    await reply.code(401).send({ error: 'Not authenticated' });
    return;
  }

  const user = await userForSessionToken(token);

  if (!user) {
    await reply.code(401).send({ error: 'Not authenticated' });
    return;
  }

  request.user = user;
}

export function currentUser(request: FastifyRequest): PublicUser {
  if (!request.user) {
    throw new Error('currentUser was called on a route without the requireAuth preHandler');
  }
  return request.user;
}
