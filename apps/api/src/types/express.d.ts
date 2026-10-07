import type { UserRole } from '@pms/shared';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware. */
      user?: { id: string; role: UserRole };
      /** Parsed + coerced query string, set by `validate({ query })` (Express 5's req.query is read-only). */
      validatedQuery?: unknown;
    }
  }
}

export {};
