import type { ApiAgeBand } from '../lib/age-mode';

/**
 * Vista REST de `GET /users/v1/me`.
 *
 * La ruta devuelve la vista directamente (sin sobre `{ ok, data }`) y con
 * nombres snake_case. No incluye `login_history`; esa vista es solo del WS.
 */
export interface UsersMeRestView {
  id: string;
  email: string | null;
  phone: string | null;
  username: string;
  display_name: string | null;
  legal_first_name: string | null;
  legal_last_name: string | null;
  country: string | null;
  birth_date: string | null;
  email_verified: boolean;
  profile_completed: boolean;
  roles: string[];
  created_at: string;
  totp_enabled: boolean;
  telegram_linked: boolean;
  layers?: unknown;
}

/** Datos de presentación que edu conserva en memoria (nunca se persisten). */
export interface UsersProfile {
  email?: string | null;
  username?: string;
  displayName?: string | null;
  birthDate?: string | null;
}

/** Respuesta de `users/v1/refresh` por WebSocket (RotateResult). */
export interface UsersRefreshData {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresInSec: number;
  jkt?: string;
  /** epoch ms del login inicial de la familia. */
  startedAt?: number;
  /** epoch ms del tope absoluto de la sesión. */
  absoluteExpiresAt?: number;
}

/**
 * Respuesta de `POST /users/v1/session/restore`.
 *
 * Rota el refresh y la cookie `gac_session`, pero NO devuelve refresh token:
 * el refresh vive solo en la cookie HttpOnly.
 */
export interface UsersRestoreData {
  userId: string;
  accessToken: string;
  expiresInSec: number;
  startedAt: number;
  absoluteExpiresAt: number;
}

export interface EduIdentity {
  identityId: string;
  kind: 'profile' | 'learner' | 'center';
  alias: string;
  userId: string | null;
  learnerId: string | null;
  ageBand: ApiAgeBand;
}

export interface EduAuthData {
  tokenType: 'DPoP';
  accessToken: string;
  refreshToken: string;
  expiresInSec: number;
  identity: EduIdentity;
}

export interface EduRefreshData {
  tokenType: 'DPoP';
  accessToken: string;
  refreshToken: string;
  expiresInSec: number;
}
