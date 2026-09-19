import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { pool } from './db/client';
import { requireEnv } from './env';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const webDist = fileURLToPath(new URL('../../web/dist', import.meta.url));
const hasWebBuild = existsSync(webDist);

export function buildApp(): FastifyInstance {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = Fastify({
    logger: isProduction
      ? true
      : {
          transport: {
            target: 'pino-pretty',
            options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
          },
        },
  });

  app.register(fastifyCookie, { secret: requireEnv('SESSION_COOKIE_SECRET') });
  app.register(fastifyMultipart, { limits: { fileSize: MAX_UPLOAD_BYTES } });

  if (hasWebBuild) {
    app.register(fastifyStatic, { root: webDist });
  }

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'Validation failed', issues: error.issues });
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  });

  app.setNotFoundHandler((request, reply) => {
    if (hasWebBuild && !request.url.startsWith('/api')) {
      return reply.sendFile('index.html');
    }
    return reply.code(404).send({ error: 'Not found' });
  });

  app.get('/api/health', async () => {
    await pool.query('select 1');
    return { status: 'ok' };
  });

  return app;
}
