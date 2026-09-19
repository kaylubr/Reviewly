import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { db } from '../db/client';
import { flashcards, mcqQuestions } from '../db/schema';
import { requireEnv } from '../env';
import { first } from '../lib/rows';

const TEST_DOMAIN = '@review-slice.reviewly.test';
const run = randomUUID();

let app: FastifyInstance;
let client: Client;
let cookie: string;
let strangerCookie: string;
let moduleId: string;

function cookieFrom(response: LightMyRequestResponse): string {
  const sessionCookie = first(response.cookies);
  return `${sessionCookie.name}=${sessionCookie.value}`;
}

async function signUp(name: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-up',
    payload: { email: `${name}-${run}${TEST_DOMAIN}`, password: 'hunter2' },
  });
  return cookieFrom(response);
}

function get(path: string, targetCookie = cookie) {
  return app.inject({ method: 'GET', url: path, headers: { cookie: targetCookie } });
}

beforeAll(async () => {
  app = buildApp({ logger: false, generator: async () => ({ summary: '', flashcards: [], questions: [] }) });
  await app.ready();
  client = new Client({ connectionString: requireEnv('DATABASE_URL') });
  await client.connect();

  cookie = await signUp('reader');
  strangerCookie = await signUp('stranger');

  const created = await app.inject({
    method: 'POST',
    url: '/api/modules',
    headers: { cookie },
    payload: { title: 'Reviewable module', content: 'Content' },
  });
  moduleId = created.json().module.id;

  await db.insert(flashcards).values([
    { moduleId, question: 'Hard card', answer: 'A', difficulty: 3 },
    { moduleId, question: 'Easy card', answer: 'B', difficulty: 1 },
    { moduleId, question: 'Medium card', answer: 'C', difficulty: 2 },
  ]);

  await db.insert(mcqQuestions).values(
    Array.from({ length: 15 }, (_, index) => ({
      moduleId,
      question: `Question ${index + 1}`,
      options: ['One', 'Two', 'Three', 'Four'],
      correctIndex: index % 4,
      explanation: `Because ${index + 1}`,
      difficulty: 1,
    })),
  );
});

afterAll(async () => {
  await client.query('delete from users where email like $1', [`%${TEST_DOMAIN}`]);
  await client.end();
  await app.close();
});

describe('review endpoints require a session', () => {
  it('refuses all three without a cookie', async () => {
    const responses = await Promise.all([
      app.inject({ method: 'GET', url: `/api/modules/${moduleId}/flashcards` }),
      app.inject({ method: 'GET', url: `/api/modules/${moduleId}/mcq` }),
      app.inject({ method: 'GET', url: `/api/modules/${moduleId}/speed` }),
    ]);

    expect(responses.map((response) => response.statusCode)).toEqual([401, 401, 401]);
  });
});

describe('another user cannot read the questions', () => {
  it('answers 404 for flashcards, mcq and speed', async () => {
    const responses = await Promise.all([
      get(`/api/modules/${moduleId}/flashcards`, strangerCookie),
      get(`/api/modules/${moduleId}/mcq`, strangerCookie),
      get(`/api/modules/${moduleId}/speed`, strangerCookie),
    ]);

    expect(responses.map((response) => response.statusCode)).toEqual([404, 404, 404]);
  });
});

describe('GET /api/modules/:id/flashcards', () => {
  it('returns every card ordered by difficulty', async () => {
    const response = await get(`/api/modules/${moduleId}/flashcards`);

    expect(response.statusCode).toBe(200);

    const difficulties = response.json().flashcards.map((card: { difficulty: number }) => card.difficulty);
    expect(difficulties).toEqual([1, 2, 3]);
  });

  it('exposes the answer to the client', async () => {
    const response = await get(`/api/modules/${moduleId}/flashcards`);

    expect(response.json().flashcards[0]).toMatchObject({ question: 'Easy card', answer: 'B' });
  });
});

describe('GET /api/modules/:id/mcq', () => {
  it('defaults to ten questions', async () => {
    const response = await get(`/api/modules/${moduleId}/mcq`);

    expect(response.statusCode).toBe(200);
    expect(response.json().questions).toHaveLength(10);
  });

  it('honours an explicit count', async () => {
    const response = await get(`/api/modules/${moduleId}/mcq?count=4`);

    expect(response.json().questions).toHaveLength(4);
  });

  it('returns the whole pool shuffled rather than in stored order', async () => {
    const stored = await db
      .select({ id: mcqQuestions.id })
      .from(mcqQuestions)
      .where(eq(mcqQuestions.moduleId, moduleId));

    const response = await get(`/api/modules/${moduleId}/mcq?count=15`);
    const returned = response.json().questions.map((question: { id: string }) => question.id);

    expect(returned).toHaveLength(15);
    expect(new Set(returned)).toEqual(new Set(stored.map((row) => row.id)));

    const storedOrder = stored.map((row) => row.id);
    expect(returned).not.toEqual(storedOrder);
  });
});

describe('GET /api/modules/:id/speed', () => {
  it('returns ten questions drawn from the pool', async () => {
    const response = await get(`/api/modules/${moduleId}/speed`);
    const questions = response.json().questions;

    expect(response.statusCode).toBe(200);
    expect(questions).toHaveLength(10);
    expect(questions[0]).toHaveProperty('correctIndex');
  });
});
