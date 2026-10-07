import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthResponse, LoginInput, RegisterInput, User } from '@pms/shared';
import { http, post, refreshSession, setAccessToken, setSessionExpiredHandler } from '../lib/api';

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

interface AuthContextValue {
  user: User | null;
  /** True until we know whether a previous session can be restored. */
  initializing: boolean;
  /** Set when the user was logged out because their session expired. */
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

  const startSession = useCallback((session: AuthResponse) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    setNotice(null);
  }, []);

  const endSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // Restore the session from the httpOnly refresh cookie on page load.
  useEffect(() => {
    refreshSession()
      .then(startSession)
      .catch(() => setUser(null))
      .finally(() => setInitializing(false));
  }, [startSession]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      endSession();
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
          await http.post('/auth/logout', {});
        } finally {
          endSession();
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
