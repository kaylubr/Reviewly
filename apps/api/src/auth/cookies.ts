import type { FastifyReply } from 'fastify';

export const SESSION_COOKIE = 'reviewly_session';

export function setSessionCookie(reply: FastifyReply, token: string, expiresAt: Date): void {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
}
