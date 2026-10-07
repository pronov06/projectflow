import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthResponse, LoginInput, RegisterInput, User } from '@pms/shared';
import { get, http, isNetworkError, post, setSessionExpiredHandler } from '../lib/api';
import { tokenStore } from '../lib/secureStore';

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  notice: string | null;
  clearNotice: () => void;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const startSession = useCallback(async (session: AuthResponse) => {
    await tokenStore.save(session.accessToken, session.refreshToken ?? '');
    await tokenStore.saveUser(session.user);
    setUser(session.user);
    setNotice(null);
  }, []);

  const endSession = useCallback(async () => {
    await tokenStore.clear();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  // Restore a previous session from secure storage when the app starts.
  useEffect(() => {
    (async () => {
      try {
        if (!(await tokenStore.getRefresh())) return;
        const me = await get<User>('/auth/me');
        await tokenStore.saveUser(me.data);
        setUser(me.data);
      } catch (err) {
        if (isNetworkError(err)) {
          // Offline at launch: keep the session and show cached data; the API is re-checked when online.
          setUser(await tokenStore.getUser());
        } else {
          // Refresh was rejected (the interceptor already showed the "session expired" notice).
          await tokenStore.clear();
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      void endSession();
      setNotice(SESSION_EXPIRED_MESSAGE);
    });
    return () => setSessionExpiredHandler(null);
  }, [endSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      notice,
      clearNotice: () => setNotice(null),
      login: async (input) => startSession(await post<AuthResponse>('/auth/login', input)),
      register: async (input) => startSession(await post<AuthResponse>('/auth/register', input)),
      logout: async () => {
        try {
          const refreshToken = await tokenStore.getRefresh();
          await http.post('/auth/logout', { refreshToken: refreshToken ?? undefined });
        } catch {
          // Logging out locally must work even if the server can't be reached.
        } finally {
          await endSession();
        }
      },
    }),
    [user, initializing, notice, startSession, endSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
