import type { Request, Response } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import type { ApiErrorBody } from '@pms/shared';
import { env } from '../config/env';

function tooManyRequests(message: string) {
  return (_req: Request, res: Response) => {
    const body: ApiErrorBody = { success: false, error: { code: 'RATE_LIMITED', message } };
    res.status(429).json(body);
  };
}

const ip = (req: Request) => ipKeyGenerator(req.ip ?? 'unknown');

/**
 * Brute-force protection for login: N failed attempts per (IP + email) per window.
 * Successful logins are not counted, so a legitimate user is never locked out by their own logins.
 */
export const loginLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_LOGIN_WINDOW_MINUTES * 60 * 1000,
  limit: env.RATE_LIMIT_LOGIN_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return `${ip(req)}|${email}`;
  },
  handler: tooManyRequests(
    `Too many failed login attempts. Please try again in ${env.RATE_LIMIT_LOGIN_WINDOW_MINUTES} minutes.`,
  ),
});

/** Limits account creation per IP. */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.RATE_LIMIT_REGISTER_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: ip,
  handler: tooManyRequests('Too many accounts created from this IP. Please try again later.'),
});

/** Token refresh is cheap but should not be hammered. */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: ip,
  handler: tooManyRequests('Too many requests. Please slow down.'),
});

/** General ceiling for all API routes. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.RATE_LIMIT_API_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: ip,
  handler: tooManyRequests('Too many requests. Please slow down.'),
});
