import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { requireEnv } from '../env';
import { first } from '../lib/rows';
import { SESSION_COOKIE } from './cookies';
import { hashPassword, verifyPassword } from './passwords';

const TEST_DOMAIN = '@auth-slice.reviewly.test';

let app: FastifyInstance;
let client: Client;
const run = randomUUID();

function emailFor(name: string): string {
  return `${name}-${run}${TEST_DOMAIN}`;
}

function cookieFrom(response: LightMyRequestResponse): string {
  const cookie = first(response.cookies);
  return `${cookie.name}=${cookie.value}`;
}

beforeAll(async () => {
  app = buildApp({ logger: false });
  await app.ready();
  client = new Client({ connectionString: requireEnv('DATABASE_URL') });
  await client.connect();
});

afterAll(async () => {
  await client.query('delete from users where email like $1', [`%${TEST_DOMAIN}`]);
  await client.end();
  await app.close();
});

describe('password hashing', () => {
  it('never stores the plaintext and verifies the right password', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(hash).not.toContain('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');

    await expect(verifyPassword('wrong password', hash)).resolves.toBe(false);
  });

  it('rejects a malformed hash instead of throwing', async () => {
    await expect(verifyPassword('anything', 'not-a-real-hash')).resolves.toBe(false);
  });
});

describe('POST /api/auth/sign-up', () => {
  it('creates the user, omits the hash, and starts a session', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: emailFor('signup'), password: 'hunter2', username: 'Signer Upper' },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body.user.email).toBe(emailFor('signup'));
    expect(body.user.username).toBe('Signer Upper');
    expect(body.user).not.toHaveProperty('passwordHash');

    const cookie = first(response.cookies);
    expect(cookie.name).toBe(SESSION_COOKIE);
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.value).not.toBe('');
  });

  it('stores the email lowercased', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: emailFor('MixedCase').toUpperCase(), password: 'hunter2' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().user.email).toBe(emailFor('mixedcase'));
  });

  it('refuses a duplicate email', async () => {
    const payload = { email: emailFor('duplicate'), password: 'hunter2' };

    expect((await app.inject({ method: 'POST', url: '/api/auth/sign-up', payload })).statusCode).toBe(201);

    const second = await app.inject({ method: 'POST', url: '/api/auth/sign-up', payload });
    expect(second.statusCode).toBe(409);
  });

  it('rejects a password below the minimum length', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: emailFor('short'), password: '12345' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('Validation failed');
  });

  it('rejects a malformed email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: 'not-an-email', password: 'hunter2' },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('POST /api/auth/sign-in', () => {
  it('signs an existing user in', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: emailFor('signin'), password: 'hunter2' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: emailFor('signin'), password: 'hunter2' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user.email).toBe(emailFor('signin'));
    expect(first(response.cookies).name).toBe(SESSION_COOKIE);
  });

  it('rejects a wrong password', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: emailFor('wrongpass'), password: 'hunter2' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: emailFor('wrongpass'), password: 'not-the-password' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('gives an unknown email the same answer as a wrong password', async () => {
    const unknown = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: emailFor('nobody'), password: 'hunter2' },
    });

    await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: emailFor('known'), password: 'hunter2' },
    });

    const wrongPassword = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: emailFor('known'), password: 'nope' },
    });

    expect(unknown.statusCode).toBe(401);
    expect(unknown.json()).toEqual(wrongPassword.json());
  });
});

describe('GET /api/auth/me', () => {
  it('returns the signed-in user for a valid session cookie', async () => {
    const signUp = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: emailFor('me'), password: 'hunter2' },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: cookieFrom(signUp) },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user.email).toBe(emailFor('me'));
    expect(response.json().user).not.toHaveProperty('passwordHash');
  });

  it('rejects a request with no cookie', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/me' });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'Not authenticated' });
  });

  it('rejects a forged cookie', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { cookie: `${SESSION_COOKIE}=not-a-real-token` },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('POST /api/auth/sign-out', () => {
  it('revokes the session so the cookie stops working', async () => {
    const signUp = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: emailFor('signout'), password: 'hunter2' },
    });
    const cookie = cookieFrom(signUp);

    expect(
      (await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } })).statusCode,
    ).toBe(200);

    const signOut = await app.inject({ method: 'POST', url: '/api/auth/sign-out', headers: { cookie } });
    expect(signOut.statusCode).toBe(204);

    expect(
      (await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie } })).statusCode,
    ).toBe(401);
  });

  it('is harmless without a session', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/sign-out' });

    expect(response.statusCode).toBe(204);
  });
});

describe('the stored session', () => {
  it('holds a hash of the token rather than the token itself', async () => {
    const signUp = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: { email: emailFor('hashme'), password: 'hunter2' },
    });

    const token = first(signUp.cookies).value;

    const result = await client.query<{ count: string }>(
      'select count(*) from auth_sessions where token_hash = $1',
      [token],
    );

    expect(first(result.rows).count).toBe('0');
  });
});
