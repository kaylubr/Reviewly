import { eq } from 'drizzle-orm';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { db } from '../db/client';
import { flashcards, mcqQuestions } from '../db/schema';
import { requireEnv } from '../env';
import { first } from '../lib/rows';
import { MAX_CONTENT_CHARACTERS } from './prompt';
import { GenerationError, parseGeneratedStudySet, type GeneratedStudySet, type QuestionGenerator } from './types';

const TEST_DOMAIN = '@generation-slice.reviewly.test';
const run = randomUUID();

const studySet: GeneratedStudySet = {
  summary: 'Cells divide to make more cells.',
  flashcards: [
    { question: 'What is mitosis?', answer: 'Division into two identical cells.', difficulty: 2 },
    { question: 'What is meiosis?', answer: 'Division into gametes.', difficulty: 3 },
  ],
  questions: [
    {
      question: 'How many cells does mitosis produce?',
      options: ['One', 'Two', 'Three', 'Four'],
      correctIndex: 1,
      explanation: 'Mitosis produces two identical cells.',
      difficulty: 1,
    },
  ],
};

let app: FastifyInstance;
let client: Client;
let cookie: string;
let otherCookie: string;
let receivedContent: string[] = [];
let behaviour: () => Promise<GeneratedStudySet> = async () => studySet;

const fakeGenerator: QuestionGenerator = async (content) => {
  receivedContent.push(content);
  return behaviour();
};

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

async function createModule(content: string | null, targetCookie = cookie): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/modules',
    headers: { cookie: targetCookie },
    payload: { title: 'Generated module', content: content ?? undefined },
  });
  return response.json().module.id;
}

function generate(moduleId: string, targetCookie = cookie) {
  return app.inject({
    method: 'POST',
    url: `/api/modules/${moduleId}/generate`,
    headers: { cookie: targetCookie },
  });
}

beforeAll(async () => {
  app = buildApp({ logger: false, generator: fakeGenerator });
  await app.ready();
  client = new Client({ connectionString: requireEnv('DATABASE_URL') });
  await client.connect();
  cookie = await signUp('generator');
  otherCookie = await signUp('intruder');
});

afterAll(async () => {
  await client.query('delete from users where email like $1', [`%${TEST_DOMAIN}`]);
  await client.end();
  await app.close();
});

describe('parseGeneratedStudySet', () => {
  it('accepts a well formed study set', () => {
    expect(parseGeneratedStudySet(studySet)).toMatchObject({ summary: studySet.summary });
  });

  it('rejects a response that is missing the questions', () => {
    expect(() => parseGeneratedStudySet({ summary: 'x', flashcards: [] })).toThrow(GenerationError);
  });

  it('rejects a question whose correctIndex is past the end of options', () => {
    const broken = {
      summary: 'x',
      flashcards: [],
      questions: [{ question: 'q', options: ['a', 'b'], correctIndex: 9, explanation: '', difficulty: 1 }],
    };

    expect(() => parseGeneratedStudySet(broken)).toThrow(GenerationError);
  });

  it('tolerates a missing difficulty rather than failing the whole generation', () => {
    const lenient = {
      summary: 'x',
      flashcards: [{ question: 'q', answer: 'a' }],
      questions: [],
    };

    expect(parseGeneratedStudySet(lenient).flashcards[0]?.difficulty).toBe(1);
  });
});

describe('POST /api/modules/:id/generate', () => {
  it('requires a session', async () => {
    const moduleId = await createModule('Some content');

    const response = await app.inject({
      method: 'POST',
      url: `/api/modules/${moduleId}/generate`,
    });

    expect(response.statusCode).toBe(401);
  });

  it('stores the generated questions and marks the module processed', async () => {
    const moduleId = await createModule('Mitosis produces two identical cells.');

    const response = await generate(moduleId);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ flashcardCount: 2, questionCount: 1, summary: studySet.summary });

    const cards = await db.select().from(flashcards).where(eq(flashcards.moduleId, moduleId));
    const questions = await db.select().from(mcqQuestions).where(eq(mcqQuestions.moduleId, moduleId));
    expect(cards).toHaveLength(2);
    expect(questions).toHaveLength(1);

    const detail = await app.inject({
      method: 'GET',
      url: `/api/modules/${moduleId}`,
      headers: { cookie },
    });
    expect(detail.json().module.aiProcessed).toBe(true);
    expect(detail.json().module.description).toBe(studySet.summary);
  });

  it('replaces earlier questions instead of piling them up', async () => {
    const moduleId = await createModule('Content for repeat generation');

    await generate(moduleId);
    await generate(moduleId);

    const cards = await db.select().from(flashcards).where(eq(flashcards.moduleId, moduleId));
    expect(cards).toHaveLength(2);
  });

  it('caps the content handed to the model', async () => {
    const moduleId = await createModule('a'.repeat(MAX_CONTENT_CHARACTERS + 5_000));

    await generate(moduleId);

    expect(first(receivedContent.slice(-1))).toHaveLength(MAX_CONTENT_CHARACTERS);
  });

  it('refuses a module with no content', async () => {
    const moduleId = await createModule(null);

    const response = await generate(moduleId);

    expect(response.statusCode).toBe(422);
  });

  it('hides another user module behind a 404', async () => {
    const moduleId = await createModule('Private content');

    const response = await generate(moduleId, otherCookie);

    expect(response.statusCode).toBe(404);
  });

  it('keeps existing questions when the model fails', async () => {
    const moduleId = await createModule('Content that survives a failure');

    await generate(moduleId);
    const before = await db.select().from(flashcards).where(eq(flashcards.moduleId, moduleId));

    behaviour = async () => {
      throw new GenerationError('The model returned questions in an unusable shape');
    };

    const response = await generate(moduleId);

    expect(response.statusCode).toBe(502);
    expect(response.json().error).toBe('The model returned questions in an unusable shape');

    const after = await db.select().from(flashcards).where(eq(flashcards.moduleId, moduleId));
    expect(after).toHaveLength(before.length);

    behaviour = async () => studySet;
  });
});
