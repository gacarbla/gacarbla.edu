import type {
  EduAuthData,
  EduIdentity,
  EduRefreshData,
  UsersProfile,
  UsersRefreshData,
  UsersRestoreData,
} from './types';

export interface UsersSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  profile?: UsersProfile;
}

export interface EduSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  identity: EduIdentity;
  /** Fecha exacta usada para el estilo; no se guarda en la API. */
  birthDate?: string | null;
}

const EDU_STORAGE_KEY = 'gacarbla.edu.session.v1';

export interface PersistedEduSession {
  refreshToken: string;
  identity: EduIdentity;
  birthDate?: string | null;
}

export const session: {
  users: UsersSession | null;
  edu: EduSession | null;
} = {
  users: null,
  edu: null,
};

function expiresAtFromNow(expiresInSec: number): number {
  return Date.now() + Math.max(0, expiresInSec) * 1000;
}

export function setUsersSession(data: UsersRefreshData | UsersRestoreData): void {
  session.users = {
    accessToken: data.accessToken,
    refreshToken: 'refreshToken' in data ? data.refreshToken : (session.users?.refreshToken ?? ''),
    expiresAt: expiresAtFromNow(data.expiresInSec),
    userId: data.userId ?? session.users?.userId ?? '',
    profile: session.users?.profile,
  };
}

export function setUsersProfile(profile: UsersProfile, userId?: string): void {
  if (!session.users) return;
  session.users.profile = profile;
  if (userId) session.users.userId = userId;
}

export function setEduSession(data: EduAuthData | EduRefreshData): void {
  const identity = 'identity' in data ? data.identity : session.edu?.identity;
  if (!identity) throw new Error('No hay identidad educativa para la nueva sesión.');

  session.edu = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: expiresAtFromNow(data.expiresInSec),
    identity,
    birthDate: session.edu?.birthDate ?? getUsersBirthDate() ?? null,
  };
  persistEduSession();
}

function persistEduSession(): void {
  try {
    if (!session.edu) {
      sessionStorage.removeItem(EDU_STORAGE_KEY);
      return;
    }
    const data: PersistedEduSession = {
      refreshToken: session.edu.refreshToken,
      identity: session.edu.identity,
      birthDate: session.edu.birthDate ?? null,
    };
    sessionStorage.setItem(EDU_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* sessionStorage no disponible: la sesión dura lo que la pestaña */
  }
}

export function readPersistedEduSession(): PersistedEduSession | null {
  try {
    const raw = sessionStorage.getItem(EDU_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedEduSession> | null;
    if (
      !parsed ||
      typeof parsed.refreshToken !== 'string' ||
      !parsed.refreshToken ||
      !parsed.identity ||
      typeof parsed.identity.identityId !== 'string'
    ) {
      return null;
    }
    return {
      refreshToken: parsed.refreshToken,
      identity: parsed.identity,
      birthDate: typeof parsed.birthDate === 'string' ? parsed.birthDate : null,
    };
  } catch {
    return null;
  }
}

export function clearUsersSession(): void {
  session.users = null;
}

export function clearEduSession(): void {
  session.edu = null;
  persistEduSession();
}

export function clearAllSessions(): void {
  session.users = null;
  session.edu = null;
  persistEduSession();
}

export function getUsersBirthDate(): string | null {
  return session.users?.profile?.birthDate ?? null;
}
