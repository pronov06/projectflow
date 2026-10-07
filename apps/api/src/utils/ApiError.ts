import type { ApiErrorCode, ApiFieldError } from '@pms/shared';

/** An error that is safe to show to API clients. Anything else becomes a generic 500. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: ApiFieldError[],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: ApiFieldError[]) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static validation(details: ApiFieldError[], message = 'Validation failed') {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static tokenExpired(message = 'Your session has expired. Please log in again.') {
    return new ApiError(401, 'TOKEN_EXPIRED', message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  /** Also used for resources owned by another user, so their existence is not revealed. */
  static notFound(resource = 'Resource') {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string) {
    return new ApiError(409, 'CONFLICT', message);
  }
}
