import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { zodToFieldErrors } from '../utils/zodErrors';
import { ApiError } from '../utils/ApiError';

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Validates and normalises the request with zod schemas from @pms/shared.
 * Unknown body fields are stripped (zod objects strip by default), so clients
 * cannot set columns like `ownerId` or `role`.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.params) {
      const r = schemas.params.safeParse(req.params);
      if (!r.success) return next(ApiError.validation(zodToFieldErrors(r.error), 'Invalid URL parameter'));
    }
    if (schemas.query) {
      const r = schemas.query.safeParse(req.query);
      if (!r.success) return next(ApiError.validation(zodToFieldErrors(r.error), 'Invalid query parameters'));
      req.validatedQuery = r.data;
    }
    if (schemas.body) {
      const r = schemas.body.safeParse(req.body ?? {});
      if (!r.success) return next(ApiError.validation(zodToFieldErrors(r.error)));
      req.body = r.data;
    }
    next();
  };
}
