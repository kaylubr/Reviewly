import { eq } from 'drizzle-orm';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { db } from '../db/client';
import { users } from '../db/schema';
import { requireEnv } from '../env';
import { first } from '../lib/rows';

const TEST_DOMAIN = '@profile-slice.reviewly.test';
const run = randomUUID();

let app: FastifyInstance;
let client: Client;
let cookie: string;
let userId: string;

function cookieFrom(response: LightMyRequestResponse): string {
  const sessionCookie = first(response.cookies);
  return `${sessionCookie.name}=${sessionCookie.value}`;
}

beforeAll(async () => {
  app = buildApp({ logger: false, generator: async () => ({ summary: '', flashcards: [], questions: [] }) });
  await app.ready();
  client = new Client({ connectionString: requireEnv('DATABASE_URL') });
  await client.connect();

  const signUp = await app.inject({
    method: 'POST',
    url: '/api/auth/sign-up',
    payload: { email: `profile-${run}${TEST_DOMAIN}`, password: 'hunter2', username: 'Before' },
  });
  cookie = cookieFrom(signUp);
  userId = signUp.json().user.id;
});

afterAll(async () => {
  await client.query('delete from users where email like $1', [`%${TEST_DOMAIN}`]);
  await client.end();
  await app.close();
});

describe('PATCH /api/profile', () => {
  it('requires a session', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/profile',
      payload: { username: 'Nope' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('updates the username and returns the user without the hash', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/profile',
      headers: { cookie },
      payload: { username: '  After  ' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user.username).toBe('After');
    expect(response.json().user).not.toHaveProperty('passwordHash');

    const rows = await db.select().from(users).where(eq(users.id, userId));
    expect(first(rows).username).toBe('After');
  });

  it('rejects a blank username', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/profile',
      headers: { cookie },
      payload: { username: '   ' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('leaves other users alone', async () => {
    const rows = await db.select().from(users).where(eq(users.id, userId));

    expect(first(rows).email).toBe(`profile-${run}${TEST_DOMAIN}`);
  });
});
