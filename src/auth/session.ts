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
  };
}

export function clearUsersSession(): void {
  session.users = null;
}

export function clearEduSession(): void {
  session.edu = null;
}

export function clearAllSessions(): void {
  session.users = null;
  session.edu = null;
}

export function getUsersBirthDate(): string | null {
  return session.users?.profile?.birthDate ?? null;
}
