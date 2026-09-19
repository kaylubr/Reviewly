import type { PublicUser } from '../auth/users';

declare module 'fastify' {
  interface FastifyRequest {
    user: PublicUser | null;
  }
}
