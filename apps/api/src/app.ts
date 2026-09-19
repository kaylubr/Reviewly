import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { authRoutes } from './auth/routes';
import { pool } from './db/client';
import { requireEnv } from './env';
import { extractRoutes } from './extract/routes';
import { createGeminiGenerator } from './generation/gemini';
import { createGenerateRoutes } from './generation/routes';
import type { QuestionGenerator } from './generation/types';
import { moduleRoutes } from './modules/routes';
import { reviewRoutes } from './review/routes';
import { sessionRoutes } from './sessions/routes';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const webDist = fileURLToPath(new URL('../../web/dist', import.meta.url));
const hasWebBuild = existsSync(webDist);

type BuildAppOptions = {
  logger?: boolean;
  generator?: QuestionGenerator;
};

function loggerConfig(enabled: boolean) {
  if (!enabled) {
    return false;
  }
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  return {
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  };
}

export function buildApp({ logger = true, generator }: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: loggerConfig(logger) });

  app.decorateRequest('user', null);

  app.register(fastifyCookie, { secret: requireEnv('SESSION_COOKIE_SECRET') });
  app.register(fastifyMultipart, { limits: { fileSize: MAX_UPLOAD_BYTES } });
  app.register(authRoutes);
  app.register(moduleRoutes);
  app.register(extractRoutes);
  app.register(createGenerateRoutes(generator ?? createGeminiGenerator()));
  app.register(reviewRoutes);
  app.register(sessionRoutes);

  if (hasWebBuild) {
    app.register(fastifyStatic, { root: webDist });
  }

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'Validation failed', issues: error.issues });
    }
    if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.code(413).send({ error: 'File is too large. Maximum 20 MB allowed.' });
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
