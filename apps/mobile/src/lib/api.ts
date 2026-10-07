import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ApiErrorBody, ApiSuccess, AuthResponse } from '@pms/shared';
import { tokenStore } from './secureStore';

/** Same backend as the web app. Set per build profile in eas.json (EXPO_PUBLIC_API_URL). */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000').replace(/\/$/, '');

export const http = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30_000,
  // Tells the API to return the refresh token in the body (stored in SecureStore) instead of a cookie.
  headers: { 'Content-Type': 'application/json', 'X-Client-Platform': 'mobile' },
});

let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (fn: (() => void) | null) => {
  onSessionExpired = fn;
};

http.interceptors.request.use(async (config) => {
  const token = await tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<AuthResponse> | null = null;

/** Exchanges the stored refresh token for a new pair. Concurrent callers share one request. */
export function refreshSession(): Promise<AuthResponse> {
  refreshing ??= (async () => {
    const refreshToken = await tokenStore.getRefresh();
    if (!refreshToken) throw new Error('No refresh token');
    const res = await axios.post<ApiSuccess<AuthResponse>>(
      `${API_URL}/api/auth/refresh`,
      { refreshToken },
      { headers: { 'X-Client-Platform': 'mobile' }, timeout: 30_000 },
    );
    await tokenStore.save(res.data.data.accessToken, res.data.data.refreshToken ?? refreshToken);
    return res.data.data;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

type RetriableConfig = AxiosRequestConfig & { _retried?: boolean };

http.interceptors.response.use(undefined, async (error: AxiosError<ApiErrorBody>) => {
  const config = error.config as RetriableConfig | undefined;
  const isAuthCall = config?.url?.startsWith('/auth/');
  if (error.response?.status === 401 && config && !config._retried && !isAuthCall) {
    config._retried = true;
    try {
      await refreshSession();
      return http(config);
    } catch (refreshError) {
      // Only a rejected refresh means the session is over; a network failure keeps the user signed in.
      if (refreshError instanceof AxiosError && !refreshError.response) throw refreshError;
      await tokenStore.clear();
      onSessionExpired?.();
    }
  }
  return Promise.reject(error);
});

export async function get<T>(url: string, params?: object) {
  return (await http.get<ApiSuccess<T>>(url, { params })).data;
}
export async function post<T>(url: string, body?: unknown) {
  return (await http.post<ApiSuccess<T>>(url, body)).data.data;
}
export async function put<T>(url: string, body: unknown) {
  return (await http.put<ApiSuccess<T>>(url, body)).data.data;
}
export async function del(url: string) {
  await http.delete(url);
}

/* ------------------------------ errors ------------------------------ */

export function isNetworkError(err: unknown) {
  return err instanceof AxiosError && !err.response;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    if (err.code === 'ECONNABORTED') {
      return 'The server is taking too long to respond. It may be waking up — please try again in a moment.';
    }
    if (!err.response) return "Can't reach the server. Check your internet connection and try again.";
    const body = err.response.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function getFieldErrors(err: unknown) {
  if (!(err instanceof AxiosError)) return [];
  return (err.response?.data as ApiErrorBody | undefined)?.error?.details ?? [];
}
