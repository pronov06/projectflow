import jwt from 'jsonwebtoken';
import type { UserRole } from '@pms/shared';
import { env } from '../config/env';
import { ApiError } from './ApiError';

const ISSUER = 'projectflow-api';
const AUDIENCE = 'projectflow-clients';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign({ role: payload.role }, env.JWT_ACCESS_SECRET, {
    subject: payload.sub,
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
  });
}

/** Verifies signature, algorithm, issuer, audience and expiry. Throws an ApiError on failure. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
      throw ApiError.unauthorized('Invalid token');
    }
    return { sub: decoded.sub, role: decoded.role === 'ADMIN' ? 'ADMIN' : 'USER' };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw ApiError.tokenExpired();
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized('Invalid token');
  }
}
