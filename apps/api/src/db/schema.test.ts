import { eq } from 'drizzle-orm';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { requireEnv } from '../env';
import { first } from '../lib/rows';
import { db } from './client';
import { flashcards, modules, users } from './schema';

let client: Client;

beforeAll(async () => {
  client = new Client({ connectionString: requireEnv('DATABASE_URL') });
  await client.connect();
});

afterAll(async () => {
  await client.end();
});

describe('schema', () => {
  it('has exactly the tables the migration declares', async () => {
    const { rows } = await client.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname = 'public' order by tablename",
    );

    expect(rows.map((row) => row.tablename)).toEqual([
      'auth_sessions',
      'flashcards',
      'mcq_questions',
      'modules',
      'sessions',
      'users',
    ]);
  });

  it('does not contain any XP-era table', async () => {
    const { rows } = await client.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname = 'public' and tablename = any($1)",
      [['profiles', 'daily_xp', 'achievements', 'user_achievements']],
    );

    expect(rows).toEqual([]);
  });

  it('references only local tables in foreign keys', async () => {
    const { rows } = await client.query<{ foreign_table: string }>(
      `select distinct confrelid::regclass::text as foreign_table
       from pg_constraint
       where contype = 'f' and connamespace = 'public'::regnamespace
       order by 1`,
    );

    expect(rows.map((row) => row.foreign_table)).toEqual(['modules', 'users']);
  });

  it('constrains review mode to the three known values', async () => {
    const result = await client.query<{ definition: string }>(
      "select pg_get_constraintdef(oid) as definition from pg_constraint where conname = 'sessions_mode_check'",
    );

    const { definition } = first(result.rows);
    expect(definition).toContain("'flashcard'");
    expect(definition).toContain("'mcq'");
    expect(definition).toContain("'speed'");
  });

  it('is queryable through Drizzle', async () => {
    const rows = await db.select().from(users);

    expect(rows).toEqual([]);
  });

  it('cascades deletes from a user down to their questions', async () => {
    await client.query('begin');

    try {
      const inserted = await client.query<{ id: string }>(
        'insert into users (email, password_hash) values ($1, $2) returning id',
        ['cascade-probe@reviewly.test', 'not-a-real-hash'],
      );
      const userId = first(inserted.rows).id;

      const insertedModule = await client.query<{ id: string }>(
        'insert into modules (user_id, title) values ($1, $2) returning id',
        [userId, 'Cascade probe'],
      );
      const moduleId = first(insertedModule.rows).id;

      await client.query(
        'insert into flashcards (module_id, question, answer) values ($1, $2, $3)',
        [moduleId, 'Question?', 'Answer.'],
      );

      await client.query('delete from users where id = $1', [userId]);

      const remaining = await client.query<{ count: string }>(
        'select count(*) from flashcards where module_id = $1',
        [moduleId],
      );
      expect(first(remaining.rows).count).toBe('0');

      const remainingModules = await db.select().from(modules).where(eq(modules.id, moduleId));
      expect(remainingModules).toEqual([]);
    } finally {
      await client.query('rollback');
    }
  });
});
