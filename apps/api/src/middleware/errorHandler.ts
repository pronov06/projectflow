import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '@pms/shared';
import { ApiError } from '../utils/ApiError';
import { zodToFieldErrors } from '../utils/zodErrors';

function toApiError(err: unknown): ApiError | null {
  if (err instanceof ApiError) return err;
  if (err instanceof ZodError) return ApiError.validation(zodToFieldErrors(err));

  // body-parser errors
  const type = (err as { type?: string } | null)?.type;
  if (type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON in request body');
  if (type === 'entity.too.large') {
    return new ApiError(413, 'BAD_REQUEST', 'Request body is too large');
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return ApiError.conflict('A record with this value already exists');
      case 'P2025':
        return ApiError.notFound();
      case 'P2003':
        return ApiError.badRequest('Related record does not exist');
      case 'P2023':
        return ApiError.badRequest('Invalid identifier');
    }
  }
  return null;
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
}

// Express recognises error handlers by their 4-argument signature.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const apiError = toApiError(err);

  if (!apiError) {
    // Unexpected error: log everything, reveal nothing.
    req.log?.error({ err }, 'Unhandled error');
    const body: ApiErrorBody = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again later.' },
    };
    return res.status(500).json(body);
  }

  if (apiError.status >= 500) req.log?.error({ err }, apiError.message);

  const body: ApiErrorBody = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  };
  res.status(apiError.status).json(body);
}
