import { describe, expect, it } from 'vitest';
import { ApiError } from './ApiError';
import { fromDbDate, toDbDate } from './dates';
import { signAccessToken, verifyAccessToken } from './jwt';
import { buildMeta, toSkipTake } from './pagination';
import { hashPassword, verifyPassword, verifyPasswordOrDummy } from './password';
import { generateRefreshToken, hashToken } from './tokens';

describe('jwt', () => {
  it('round-trips a payload', () => {
    const token = signAccessToken({ sub: 'user-1', role: 'USER' });
    expect(verifyAccessToken(token)).toEqual({ sub: 'user-1', role: 'USER' });
  });

  it('rejects tampered tokens', () => {
    const token = signAccessToken({ sub: 'user-1', role: 'USER' });
    const [h, , s] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: 'user-2', role: 'ADMIN' })).toString('base64url');
    expect(() => verifyAccessToken(`${h}.${forgedPayload}.${s}`)).toThrow(ApiError);
  });
});

describe('password', () => {
  it('hashes with bcrypt and verifies', async () => {
    const hash = await hashPassword('Password1');
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword('Password1', hash)).toBe(true);
    expect(await verifyPassword('Password2', hash)).toBe(false);
  });

  it('never authenticates a missing user', async () => {
    expect(await verifyPasswordOrDummy('anything', undefined)).toBe(false);
  });
});

describe('tokens', () => {
  it('generates unique tokens and stable SHA-256 hashes', () => {
    const a = generateRefreshToken();
    expect(a).not.toBe(generateRefreshToken());
    expect(hashToken(a)).toHaveLength(64);
    expect(hashToken(a)).toBe(hashToken(a));
  });
});

describe('pagination', () => {
  it('computes skip/take and meta', () => {
    expect(toSkipTake(3, 20)).toEqual({ skip: 40, take: 20 });
    expect(buildMeta(1, 20, 0)).toEqual({ page: 1, limit: 20, total: 0, totalPages: 1 });
    expect(buildMeta(2, 10, 25).totalPages).toBe(3);
  });
});

describe('dates', () => {
  it('converts between YYYY-MM-DD and UTC dates', () => {
    expect(fromDbDate(toDbDate('2026-10-07') as Date)).toBe('2026-10-07');
    expect(toDbDate(null)).toBeNull();
    expect(toDbDate(undefined)).toBeUndefined();
  });
});
