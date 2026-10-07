import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@pms/shared';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';

/** Requires a valid `Authorization: Bearer <access token>` header and attaches `req.user`. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  const payload = verifyAccessToken(header.slice('Bearer '.length).trim());
  req.user = { id: payload.sub, role: payload.role };
  next();
}

/** Role-based guard; use after `authenticate`. */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}

/** The authenticated user's id. Only call on routes behind `authenticate`. */
export function currentUserId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}
