'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/endpoints';
import { configureHttp } from '../api/http';
import { clearSession, loadSession, saveSession, sessionFromLogin, type Session } from '../api/session';
import type { AuthUser, Role } from '../api/types';

interface AuthContextValue {
  ready: boolean;
  user: AuthUser | null;
  /** True after an explicit logout or expiry: the provider handles the redirect, guards must not race it. */
  signingOut: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const STAFF_ROLES: readonly Role[] = ['OPS', 'APPROVER', 'ADMIN'];

export function homeFor(role: Role): string {
  return role === 'CUSTOMER' ? '/transactions' : '/ops';
}

/** Holds the session and wires the HTTP client: JWT on every call, global 401 → logout. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const endSession = useCallback(
    (reason?: 'expired') => {
      setSigningOut(true);
      clearSession();
      setSession(null);
      queryClient.clear();
      router.replace(reason ? `/login?reason=${reason}` : '/login');
    },
    [queryClient, router],
  );

  useEffect(() => {
    configureHttp({ getToken: () => loadSession()?.accessToken ?? null, onUnauthorized: () => endSession('expired') });
    // Reading sessionStorage must happen after hydration, hence the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loadSession());
    setReady(true);
  }, [endSession]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    const next = sessionFromLogin(response);
    saveSession(next);
    setSession(next);
    setSigningOut(false);
    return next.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ready, user: session?.user ?? null, signingOut, login, logout: () => endSession() }),
    [ready, session, signingOut, login, endSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
