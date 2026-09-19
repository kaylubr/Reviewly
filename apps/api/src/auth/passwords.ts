import { hash, verify } from '@node-rs/argon2';

export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return verify(passwordHash, password).catch(() => false);
}
