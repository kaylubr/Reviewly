import { eq } from 'drizzle-orm';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { db } from '../db/client';
import { modules, sessions, users } from '../db/schema';
import { requireEnv } from '../env';
import { first } from '../lib/rows';

const TEST_DOMAIN = '@sessions-slice.reviewly.test';
const run = randomUUID();

let app: FastifyInstance;
let client: Client;
let cookie: string;
let strangerCookie: string;
let userId: string;
let moduleId: string;

function cookieFrom(response: LightMyRequestResponse): string {
  const sessionCookie = first(response.cookies);
  return `${sessionCookie.name}=${sessionCookie.value}`;
}

async function signUp(name: string): Promise<{ cookie: string; id: string }> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-up',
    payload: { email: `${name}-${run}${TEST_DOMAIN}`, password: 'hunter2' },
  });
  return { cookie: cookieFrom(response), id: response.json().user.id };
}

async function createModule(targetCookie = cookie): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/modules',
    headers: { cookie: targetCookie },
    payload: { title: 'Session module', content: 'Content' },
  });
  return response.json().module.id;
}

function complete(body: Record<string, unknown>, targetCookie = cookie) {
  return app.inject({
    method: 'POST',
    url: '/api/sessions/complete',
    headers: { cookie: targetCookie },
    payload: body,
  });
}

beforeAll(async () => {
  app = buildApp({ logger: false, generator: async () => ({ summary: '', flashcards: [], questions: [] }) });
  await app.ready();
  client = new Client({ connectionString: requireEnv('DATABASE_URL') });
  await client.connect();

  const owner = await signUp('completer');
  cookie = owner.cookie;
  userId = owner.id;

  strangerCookie = (await signUp('stranger')).cookie;
  moduleId = await createModule();
});

afterAll(async () => {
  await client.query('delete from users where email like $1', [`%${TEST_DOMAIN}`]);
  await client.end();
  await app.close();
});

describe('POST /api/sessions/complete', () => {
  it('requires a session', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/sessions/complete',
      payload: { moduleId, mode: 'mcq', correctAnswers: 1, totalQuestions: 2, durationSeconds: 10 },
    });

    expect(response.statusCode).toBe(401);
  });

  it('records the session and scores it', async () => {
    const response = await complete({
      moduleId,
      mode: 'mcq',
      correctAnswers: 8,
      totalQuestions: 10,
      durationSeconds: 300,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ score: 80, moduleTotalSessions: 1, masteryScore: 80 });

    const stored = await db.select().from(sessions).where(eq(sessions.moduleId, moduleId));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ score: 80, correctAnswers: 8, totalQuestions: 10, mode: 'mcq' });
  });

  it('rolls the module mastery into an average of its sessions', async () => {
    await complete({
      moduleId,
      mode: 'flashcard',
      correctAnswers: 6,
      totalQuestions: 10,
      durationSeconds: 120,
    });

    const moduleRows = await db.select().from(modules).where(eq(modules.id, moduleId));
    const module = first(moduleRows);

    const recorded = await db
      .select({ score: sessions.score })
      .from(sessions)
      .where(eq(sessions.moduleId, moduleId));

    const expectedMastery = Math.round(
      recorded.reduce((total, row) => total + row.score, 0) / recorded.length,
    );

    expect(Number(module.masteryScore)).toBe(expectedMastery);
    expect(module.totalSessions).toBe(recorded.length);
  });

  it('adds to the user study totals', async () => {
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    const user = first(userRows);

    const recorded = await db.select().from(sessions).where(eq(sessions.userId, userId));
    const expectedMinutes = recorded.reduce(
      (total, row) => total + Math.floor(row.durationSeconds / 60),
      0,
    );

    expect(user.totalSessions).toBe(recorded.length);
    expect(user.totalStudyTimeMinutes).toBe(expectedMinutes);
  });

  it('scores a session with no questions as zero', async () => {
    const response = await complete({
      moduleId,
      mode: 'speed',
      correctAnswers: 0,
      totalQuestions: 0,
      durationSeconds: 5,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().score).toBe(0);
  });

  it('rejects more correct answers than questions', async () => {
    const response = await complete({
      moduleId,
      mode: 'mcq',
      correctAnswers: 11,
      totalQuestions: 10,
      durationSeconds: 60,
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects an unknown review mode', async () => {
    const response = await complete({
      moduleId,
      mode: 'essay',
      correctAnswers: 1,
      totalQuestions: 2,
      durationSeconds: 60,
    });

    expect(response.statusCode).toBe(400);
  });

  it('refuses to record against another user module', async () => {
    const otherModuleId = await createModule(strangerCookie);

    const response = await complete(
      { moduleId: otherModuleId, mode: 'mcq', correctAnswers: 1, totalQuestions: 2, durationSeconds: 30 },
      cookie,
    );

    expect(response.statusCode).toBe(404);
  });
});

describe('GET /api/sessions/history', () => {
  it('requires a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/sessions/history' });

    expect(response.statusCode).toBe(401);
  });

  it('returns the user sessions newest first, with the module title', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/sessions/history',
      headers: { cookie },
    });

    expect(response.statusCode).toBe(200);

    const listed = response.json().sessions;
    expect(listed.length).toBeGreaterThan(0);
    expect(listed[0].moduleTitle).toBe('Session module');

    const dates = listed.map((session: { completedAt: string }) => session.completedAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('never shows another user sessions', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/sessions/history',
      headers: { cookie: strangerCookie },
    });

    expect(response.json().sessions).toEqual([]);
  });

  it('honours the limit', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/sessions/history?limit=1',
      headers: { cookie },
    });

    expect(response.json().sessions).toHaveLength(1);
  });
});
