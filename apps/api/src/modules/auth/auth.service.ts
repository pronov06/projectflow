import type { User as DbUser } from '@prisma/client';
import type { User } from '@pms/shared';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { signAccessToken } from '../../utils/jwt';
import { hashPassword, verifyPasswordOrDummy } from '../../utils/password';
import { generateRefreshToken, hashToken } from '../../utils/tokens';
import { audit } from '../audit/audit.service';

/** Columns that are safe to return. The password hash is never selected for responses. */
export const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

type PublicUserRow = Pick<DbUser, 'id' | 'fullName' | 'email' | 'role' | 'createdAt'>;

export function toPublicUser(u: PublicUserRow): User {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

interface ClientContext {
  ip?: string;
  userAgent?: string;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
  refreshTokenExpiresAt: Date;
}

async function issueSession(user: PublicUserRow, ctx: ClientContext): Promise<Session> {
  const refreshToken = generateRefreshToken();
  const refreshTokenExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
  const row = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
      userAgent: ctx.userAgent?.slice(0, 255),
    },
    select: { id: true },
  });
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken,
    refreshTokenId: row.id,
    refreshTokenExpiresAt,
  };
}

export async function register(
  input: { fullName: string; email: string; password: string },
  ctx: ClientContext,
): Promise<Session> {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    },
    select: publicUserSelect,
  });
  audit({ userId: user.id, action: 'USER_REGISTERED', entityType: 'USER', entityId: user.id, ip: ctx.ip });
  return issueSession(user, ctx);
}

export async function login(
  input: { email: string; password: string },
  ctx: ClientContext,
): Promise<Session> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...publicUserSelect, passwordHash: true },
  });
  const ok = await verifyPasswordOrDummy(input.password, user?.passwordHash);
  if (!user || !ok) {
    audit({ userId: user?.id ?? null, action: 'LOGIN_FAILED', ip: ctx.ip });
    // Same message whether the email exists or not (no user enumeration).
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  const { passwordHash: _omit, ...publicUser } = user;
  audit({ userId: user.id, action: 'USER_LOGIN', entityType: 'USER', entityId: user.id, ip: ctx.ip });
  return issueSession(publicUser, ctx);
}

/**
 * Rotates a refresh token: the presented token is revoked and replaced by a new one.
 * Presenting an already-revoked token means it was stolen or replayed, so every
 * active session of that user is revoked.
 */
export async function refresh(presentedToken: string | undefined, ctx: ClientContext): Promise<Session> {
  if (!presentedToken) throw ApiError.unauthorized('No refresh token provided');

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(presentedToken) },
    include: { user: { select: publicUserSelect } },
  });
  if (!stored) throw ApiError.unauthorized('Invalid refresh token');

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    audit({ userId: stored.userId, action: 'REFRESH_TOKEN_REUSE', ip: ctx.ip });
    throw ApiError.tokenExpired();
  }
  if (stored.expiresAt <= new Date()) throw ApiError.tokenExpired();

  // Conditional revoke: if two requests race with the same token, only one wins.
  const revoked = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (revoked.count === 0) throw ApiError.tokenExpired();

  const session = await issueSession(stored.user, ctx);
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { replacedById: session.refreshTokenId },
  });
  return session;
}

/** Revokes the given refresh token. Idempotent: unknown or already-revoked tokens are ignored. */
export async function logout(presentedToken: string | undefined, ctx: ClientContext) {
  if (!presentedToken) return;
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(presentedToken) },
    select: { id: true, userId: true, revokedAt: true },
  });
  if (!stored || stored.revokedAt) return;
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  audit({ userId: stored.userId, action: 'USER_LOGOUT', ip: ctx.ip });
}

export async function getMe(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  // A valid token for a deleted user is treated like an invalid session.
  if (!user) throw ApiError.unauthorized('User no longer exists');
  return toPublicUser(user);
}
