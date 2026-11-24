import type { AuthUser, LoginResponse } from './types';

/** Token storage per TRD §5.2: in memory + sessionStorage, cleared on logout. */
const STORAGE_KEY = 'refunddesk.session';

export interface Session {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
}

let memory: Session | null = null;

export function sessionFromLogin(login: LoginResponse, now = Date.now()): Session {
  return { accessToken: login.accessToken, expiresAt: now + login.expiresIn * 1000, user: login.user };
}

export function loadSession(now = Date.now()): Session | null {
  if (!memory && typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      memory = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      memory = null;
    }
  }
  if (memory && memory.expiresAt <= now) {
    clearSession();
  }
  return memory;
}

export function saveSession(session: Session): void {
  memory = session;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be blocked (private mode); the in-memory copy still works for this tab.
  }
}

export function clearSession(): void {
  memory = null;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore: nothing to clear
  }
}
