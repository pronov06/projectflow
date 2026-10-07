import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ApiErrorBody, ApiSuccess, AuthResponse } from '@pms/shared';

/**
 * In production the web app calls `/api` on its own origin, which Vercel rewrites to the API.
 * That keeps the httpOnly refresh cookie first-party. Override with VITE_API_URL if needed.
 */
const baseURL = import.meta.env.VITE_API_URL ?? '/api';

export const http = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 60_000, // generous: the free API host can take ~50s to wake up
  headers: { 'Content-Type': 'application/json' },
});

/* ---------------- access token: memory only, never localStorage ---------------- */

let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

let onSessionExpired: (() => void) | null = null;
/** AuthProvider registers what to do when the session cannot be refreshed. */
export const setSessionExpiredHandler = (fn: (() => void) | null) => {
  onSessionExpired = fn;
};

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/* ---------------- one shared refresh for concurrent 401s ---------------- */

let refreshing: Promise<AuthResponse> | null = null;

export function refreshSession(): Promise<AuthResponse> {
  refreshing ??= http
    .post<ApiSuccess<AuthResponse>>('/auth/refresh', {})
    .then((res) => {
      setAccessToken(res.data.data.accessToken);
      return res.data.data;
    })
    .finally(() => {
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
    } catch {
      setAccessToken(null);
      onSessionExpired?.();
    }
  }
  return Promise.reject(error);
});

/* ---------------- helpers ---------------- */

export async function get<T>(url: string, params?: object) {
  const res = await http.get<ApiSuccess<T>>(url, { params });
  return res.data;
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
