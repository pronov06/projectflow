import { createHash, randomBytes } from 'node:crypto';

/** 384 bits of randomness, URL-safe. Sent to the client once; never stored in plain form. */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
