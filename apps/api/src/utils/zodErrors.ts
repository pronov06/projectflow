import type { ZodError } from 'zod';
import type { ApiFieldError } from '@pms/shared';

export function zodToFieldErrors(error: ZodError): ApiFieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join('.') : '_root',
    message: issue.message,
  }));
}
