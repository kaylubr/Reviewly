import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/client';
import { authSessions, users } from '../db/schema';
import { publicUserColumns, type PublicUser } from './users';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function startSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(authSessions).values({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });

  return { token, expiresAt };
}

export async function userForSessionToken(token: string): Promise<PublicUser | null> {
  const rows = await db
    .select(publicUserColumns)
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(
      and(
        eq(authSessions.tokenHash, hashSessionToken(token)),
        gt(authSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function endSession(token: string): Promise<void> {
  await db.delete(authSessions).where(eq(authSessions.tokenHash, hashSessionToken(token)));
}
