import { apiRequest } from '../api/http';
import { ApiError, isApiError } from '../api/errors';
import { HPKE_INFO_EDU, sealCredentials } from './hpke';
import { clearEduSession, session, setEduSession } from './session';
import type { EduAuthData, EduIdentity, EduRefreshData } from './types';
import { wsClient } from './ws';

export interface LearnerLoginInput {
  alias: string;
  password: string;
  pin?: string;
  securityAnswer?: string;
  language?: string;
}

export interface EduMeData extends EduIdentity {
  nickname?: string | null;
  language?: string;
  status?: string | null;
  notifications?: { email: boolean; push: boolean; digest: 'off' | 'daily' | 'weekly' };
}

export interface EduExchangeInput {
  alias?: string;
  birthDate?: string;
  nickname?: string;
  language?: string;
}

export async function exchangeEdu(input: EduExchangeInput = {}): Promise<EduAuthData> {
  const body: Record<string, string> = {};
  if (input.alias) body.alias = input.alias;
  if (input.birthDate) body.birthDate = input.birthDate;
  if (input.nickname) body.nickname = input.nickname;
  if (input.language) body.language = input.language;

  const data = await apiRequest<EduAuthData>('/edu/v1/auth/exchange', {
    method: 'POST',
    body,
    auth: 'users',
  });
  setEduSession(data);
  return data;
}

export async function loginLearner(input: LearnerLoginInput): Promise<EduAuthData> {
  const hello = await wsClient.hello();
  const protectedPayload = await sealCredentials(
    hello.serverHpkePubB64,
    {
      alias: input.alias,
      password: input.password,
      ...(input.pin ? { pin: input.pin } : {}),
      ...(input.securityAnswer ? { securityAnswer: input.securityAnswer } : {}),
    },
    HPKE_INFO_EDU,
  );

  const data = await apiRequest<EduAuthData>('/edu/v1/auth/learner/login', {
    method: 'POST',
    body: {
      alias: input.alias,
      protectedPayload,
      ...(input.language ? { language: input.language } : {}),
    },
    auth: 'none',
    dpop: true,
  });
  setEduSession(data);
  return data;
}

export interface LearnerIdentifyResult {
  needsSecondFactor: true;
  factors: Array<'pin' | 'security_answer'>;
  question?: string;
}

/**
 * Comprueba alias y contraseña sin completar el login. La API responde
 * `EDU_SECOND_FACTOR_REQUIRED` con el método efectivo (PIN o pregunta) cuando
 * la contraseña es correcta y falta el segundo paso. Con una API antigua,
 * devuelve `EDU_LOGIN_INVALID` y la UI ofrece el fallback.
 */
export async function identifyLearner(input: {
  alias: string;
  password: string;
}): Promise<LearnerIdentifyResult | EduAuthData> {
  const hello = await wsClient.hello();
  const protectedPayload = await sealCredentials(
    hello.serverHpkePubB64,
    { alias: input.alias, password: input.password },
    HPKE_INFO_EDU,
  );

  try {
    const data = await apiRequest<EduAuthData>('/edu/v1/auth/learner/login', {
      method: 'POST',
      body: { alias: input.alias, protectedPayload },
      auth: 'none',
      dpop: true,
    });
    setEduSession(data);
    return data;
  } catch (error) {
    if (isApiError(error) && error.code === 'EDU_SECOND_FACTOR_REQUIRED') {
      const details = (error.details ?? {}) as { factors?: unknown; question?: unknown };
      const factors = Array.isArray(details.factors)
        ? details.factors.filter(
            (factor): factor is 'pin' | 'security_answer' =>
              factor === 'pin' || factor === 'security_answer',
          )
        : [];
      return {
        needsSecondFactor: true,
        factors,
        ...(typeof details.question === 'string' && details.question
          ? { question: details.question }
          : {}),
      };
    }
    throw error;
  }
}

export async function refreshEdu(): Promise<EduRefreshData> {
  const current = session.edu;
  if (!current) {
    throw new ApiError({ code: 'EDU_SESSION_EXPIRED', message: 'No hay sesión educativa.' }, 401);
  }

  const data = await apiRequest<EduRefreshData>('/edu/v1/auth/refresh', {
    method: 'POST',
    body: { refreshToken: current.refreshToken },
    auth: 'none',
    dpop: true,
  });
  setEduSession(data);
  return data;
}

export async function logoutEdu(allSessions = false): Promise<void> {
  const current = session.edu;
  if (!current) return;

  try {
    await apiRequest('/edu/v1/auth/logout', {
      method: 'POST',
      body: { refreshToken: current.refreshToken, allSessions },
      auth: 'edu',
    });
  } finally {
    clearEduSession();
  }
}

export async function getEduMe(): Promise<EduMeData> {
  return apiRequest<EduMeData>('/edu/v1/me', { auth: 'edu' });
}
