import { eq } from 'drizzle-orm';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { SESSION_COOKIE } from '../auth/cookies';
import { db } from '../db/client';
import { flashcards } from '../db/schema';
import { requireEnv } from '../env';
import { first } from '../lib/rows';

const TEST_DOMAIN = '@modules-slice.reviewly.test';
const run = randomUUID();

let app: FastifyInstance;
let client: Client;
let ownerCookie: string;
let strangerCookie: string;

function cookieFrom(response: LightMyRequestResponse): string {
  const cookie = first(response.cookies);
  return `${cookie.name}=${cookie.value}`;
}

async function signUp(name: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-up',
    payload: { email: `${name}-${run}${TEST_DOMAIN}`, password: 'hunter2' },
  });
  return cookieFrom(response);
}

async function createModule(cookie: string, payload: Record<string, unknown>) {
  return app.inject({ method: 'POST', url: '/api/modules', headers: { cookie }, payload });
}

beforeAll(async () => {
  app = buildApp({ logger: false });
  await app.ready();
  client = new Client({ connectionString: requireEnv('DATABASE_URL') });
  await client.connect();
  ownerCookie = await signUp('owner');
  strangerCookie = await signUp('stranger');
});

afterAll(async () => {
  await client.query('delete from users where email like $1', [`%${TEST_DOMAIN}`]);
  await client.end();
  await app.close();
});

describe('modules require a session', () => {
  it('refuses every endpoint without a cookie', async () => {
    const responses = await Promise.all([
      app.inject({ method: 'GET', url: '/api/modules' }),
      app.inject({ method: 'GET', url: '/api/modules/00000000-0000-0000-0000-000000000000' }),
      app.inject({ method: 'POST', url: '/api/modules', payload: { title: 'Nope' } }),
      app.inject({ method: 'DELETE', url: '/api/modules/00000000-0000-0000-0000-000000000000' }),
    ]);

    expect(responses.map((response) => response.statusCode)).toEqual([401, 401, 401, 401]);
  });
});

describe('POST /api/modules', () => {
  it('creates a module with the expected defaults', async () => {
    const response = await createModule(ownerCookie, {
      title: 'Biology Chapter 5',
      description: 'Cell division',
      content: 'Mitosis is...',
      tags: ['biology', 'cells'],
    });

    expect(response.statusCode).toBe(201);

    const { module } = response.json();
    expect(module.title).toBe('Biology Chapter 5');
    expect(module.tags).toEqual(['biology', 'cells']);
    expect(module.masteryScore).toBe(0);
    expect(module.totalSessions).toBe(0);
    expect(module.aiProcessed).toBe(false);
  });

  it('stores blank content as null rather than an empty string', async () => {
    const response = await createModule(ownerCookie, { title: 'Blank content', content: '   ' });

    expect(response.statusCode).toBe(201);
    expect(response.json().module.content).toBeNull();
  });

  it('rejects a missing title', async () => {
    const response = await createModule(ownerCookie, { content: 'no title' });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('Validation failed');
  });

  it('rejects a title longer than the limit', async () => {
    const response = await createModule(ownerCookie, { title: 'x'.repeat(121) });

    expect(response.statusCode).toBe(400);
  });

  it('rejects more tags than the limit', async () => {
    const response = await createModule(ownerCookie, {
      title: 'Too many tags',
      tags: Array.from({ length: 11 }, (_, index) => `tag-${index}`),
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /api/modules', () => {
  it('lists only the signed-in user modules', async () => {
    await createModule(ownerCookie, { title: 'Owned by owner' });
    await createModule(strangerCookie, { title: 'Owned by stranger' });

    const response = await app.inject({ method: 'GET', url: '/api/modules', headers: { cookie: ownerCookie } });

    expect(response.statusCode).toBe(200);

    const titles = response.json().modules.map((module: { title: string }) => module.title);
    expect(titles).toContain('Owned by owner');
    expect(titles).not.toContain('Owned by stranger');
  });

  it('orders by most recently updated', async () => {
    const older = await createModule(ownerCookie, { title: 'Older module' });
    const newer = await createModule(ownerCookie, { title: 'Newer module' });

    await client.query("update modules set updated_at = now() + interval '1 hour' where id = $1", [
      older.json().module.id,
    ]);

    const response = await app.inject({ method: 'GET', url: '/api/modules', headers: { cookie: ownerCookie } });
    const ids = response.json().modules.map((module: { id: string }) => module.id);

    expect(ids.indexOf(older.json().module.id)).toBeLessThan(ids.indexOf(newer.json().module.id));
  });
});

describe('GET /api/modules/:id', () => {
  it('returns the module with its question counts', async () => {
    const created = await createModule(ownerCookie, { title: 'Counted module' });
    const moduleId = created.json().module.id;

    await db.insert(flashcards).values([
      { moduleId, question: 'Q1', answer: 'A1' },
      { moduleId, question: 'Q2', answer: 'A2' },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: `/api/modules/${moduleId}`,
      headers: { cookie: ownerCookie },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().module.flashcardCount).toBe(2);
    expect(response.json().module.questionCount).toBe(0);
  });

  it('hides another user module behind a 404', async () => {
    const created = await createModule(ownerCookie, { title: 'Private module' });

    const response = await app.inject({
      method: 'GET',
      url: `/api/modules/${created.json().module.id}`,
      headers: { cookie: strangerCookie },
    });

    expect(response.statusCode).toBe(404);
  });

  it('returns 404 for an unknown id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/modules/00000000-0000-0000-0000-000000000000',
      headers: { cookie: ownerCookie },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /api/modules/:id', () => {
  it('deletes the module and cascades to its questions', async () => {
    const created = await createModule(ownerCookie, { title: 'Doomed module' });
    const moduleId = created.json().module.id;

    await db.insert(flashcards).values({ moduleId, question: 'Q', answer: 'A' });

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/modules/${moduleId}`,
      headers: { cookie: ownerCookie },
    });
    expect(deleted.statusCode).toBe(204);

    const remaining = await db.select().from(flashcards).where(eq(flashcards.moduleId, moduleId));
    expect(remaining).toEqual([]);

    const lookup = await app.inject({
      method: 'GET',
      url: `/api/modules/${moduleId}`,
      headers: { cookie: ownerCookie },
    });
    expect(lookup.statusCode).toBe(404);
  });

  it('refuses to delete another user module and leaves it intact', async () => {
    const created = await createModule(ownerCookie, { title: 'Survives' });
    const moduleId = created.json().module.id;

    const attempt = await app.inject({
      method: 'DELETE',
      url: `/api/modules/${moduleId}`,
      headers: { cookie: strangerCookie },
    });
    expect(attempt.statusCode).toBe(404);

    const stillThere = await app.inject({
      method: 'GET',
      url: `/api/modules/${moduleId}`,
      headers: { cookie: ownerCookie },
    });
    expect(stillThere.statusCode).toBe(200);
  });

  it('returns 404 for an unknown id', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/modules/00000000-0000-0000-0000-000000000000',
      headers: { cookie: ownerCookie },
    });

    expect(response.statusCode).toBe(404);
  });
});
