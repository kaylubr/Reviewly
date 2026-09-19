import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { requireEnv } from '../env';

export const pool = new Pool({ connectionString: requireEnv('DATABASE_URL') });

export const db = drizzle(pool);
