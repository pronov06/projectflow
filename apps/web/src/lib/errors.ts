import { AxiosError } from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiErrorBody, ApiFieldError } from '@pms/shared';

export function isNetworkError(err: unknown) {
  return err instanceof AxiosError && !err.response;
}

/** A human-readable message for any error thrown by the API client. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    if (err.code === 'ECONNABORTED') {
      return 'The server is taking too long to respond. It may be waking up — please try again.';
    }
    if (!err.response) return "Can't reach the server. Check your internet connection and try again.";
    const body = err.response.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    if (err.response.status >= 500) return 'Something went wrong on our side. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

export function getFieldErrors(err: unknown): ApiFieldError[] {
  if (err instanceof AxiosError) {
    return (err.response?.data as ApiErrorBody | undefined)?.error?.details ?? [];
  }
  return [];
}

/**
 * Maps server-side validation errors onto form fields. Returns true when at least one
 * field error was applied, so the caller can skip a generic toast.
 */
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>) {
  const details = getFieldErrors(err);
  for (const d of details) {
    setError(d.field as Path<T>, { type: 'server', message: d.message });
  }
  return details.length > 0;
}
