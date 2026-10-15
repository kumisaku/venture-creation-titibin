import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setApiToken, setUnauthorizedHandler } from './api';
import type { Role, User } from './types';

const TOKEN_KEY = 'titibin.token';

type RegisterInput = { name: string; nim: string; email: string; campus: string; password: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'nim' | 'campus' | 'about'>> & { role?: Role }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clear = useCallback(async () => {
    setApiToken(null);
    setUser(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
  }, []);

  const refresh = useCallback(async () => {
    setUser(await api<User>('/me'));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void clear());
    (async () => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        setApiToken(token);
        try {
          await refresh();
        } catch {
          // Server unreachable or session expired: fall back to the login screen.
          await clear();
        }
      }
      setLoading(false);
    })();
  }, [clear, refresh]);

  const startSession = useCallback(
    async ({ token }: { token: string }) => {
      setApiToken(token);
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => startSession(await api('/auth/login', { body: { email, password } })),
      register: async (input) => startSession(await api('/auth/register', { body: input })),
      logout: async () => {
        await api('/auth/logout', { method: 'POST' }).catch(() => {});
        await clear();
      },
      refresh,
      updateProfile: async (patch) => {
        await api('/me', { method: 'PATCH', body: patch });
        await refresh();
      },
    }),
    [user, loading, startSession, clear, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
