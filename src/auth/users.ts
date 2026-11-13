import { API_BASE_URL } from '../api/config';
import { ApiError, isApiError } from '../api/errors';
import { apiRequest, apiRequestRaw } from '../api/http';
import { createDpopProof } from './dpop';
import { clearUsersSession, session, setUsersSession } from './session';
import type { UsersMeRestView, UsersRefreshData, UsersRestoreData } from './types';
import { wsClient } from './ws';

export async function refreshUsers(): Promise<UsersRefreshData> {
  const current = session.users;
  if (!current) {
    throw new ApiError({ code: 'AUTH_REQUIRED', message: 'No hay sesión de usuario.' }, 401);
  }

  // Tras el acceso por ventana no tenemos refresh en memoria: solo la cookie
  // HttpOnly. La renovación se hace restaurando la sesión.
  if (!current.refreshToken) {
    const restored = await restoreUsersSession();
    return { ...restored, refreshToken: '' };
  }

  const device = await wsClient.getDevice();
  const proof = await createDpopProof({
    keyPair: device.keyPair,
    publicJwk: device.publicJwk,
    htu: `${API_BASE_URL}/ws:users/v1/refresh`,
    htm: 'POST',
    nonce: await wsClient.ensureNonce(),
  });

  const data = await wsClient.request<UsersRefreshData>('users/v1/refresh', {
    refreshToken: current.refreshToken,
    _dpop: proof,
  });
  setUsersSession(data);
  return data;
}

export async function logoutUsers(allSessions = false): Promise<void> {
  const current = session.users;
  if (!current) return;

  try {
    if (allSessions) {
      const device = await wsClient.getDevice();
      const proof = await createDpopProof({
        keyPair: device.keyPair,
        publicJwk: device.publicJwk,
        htu: `${API_BASE_URL}/ws:users/v1/logout-all`,
        htm: 'POST',
        nonce: await wsClient.ensureNonce(),
        accessToken: current.accessToken,
      });
      await wsClient.request('users/v1/logout-all', {
        _dpop: proof,
        _access: current.accessToken,
      });
    } else {
      const device = await wsClient.getDevice();
      const proof = await createDpopProof({
        keyPair: device.keyPair,
        publicJwk: device.publicJwk,
        htu: `${API_BASE_URL}/ws:users/v1/logout`,
        htm: 'POST',
        nonce: await wsClient.ensureNonce(),
        accessToken: current.accessToken,
      });
      await wsClient.request('users/v1/logout', {
        _dpop: proof,
        _access: current.accessToken,
      });
    }
  } finally {
    clearUsersSession();
  }
}

export async function getUsersMe(): Promise<UsersMeRestView> {
  return apiRequestRaw<UsersMeRestView>('/users/v1/me', { auth: 'users' });
}

/**
 * Restaura la sesión users desde la cookie HttpOnly que dejó la ventana de
 * api.gacarbla.es tras el login. Requiere el WS vivo y su connectionId.
 */
export async function restoreUsersSession(): Promise<UsersRestoreData> {
  try {
    return await restoreUsersSessionOnce();
  } catch (error) {
    // El registro `ws:<connectionId>` caduca o el socket se reconectó: un
    // hello nuevo recupera la conexión y se reintenta una vez.
    if (isApiError(error) && (error.code === 'WS_REQUIRED' || error.code === 'WS_CLOSED')) {
      await wsClient.hello(true);
      return restoreUsersSessionOnce();
    }
    throw error;
  }
}

async function restoreUsersSessionOnce(): Promise<UsersRestoreData> {
  if (!wsClient.connectionId) await wsClient.hello();
  const connectionId = wsClient.connectionId;
  if (!connectionId) {
    throw new ApiError(
      { code: 'WS_REQUIRED', message: 'No hay conexión WebSocket para restaurar la sesión.' },
      409,
    );
  }

  const data = await apiRequest<UsersRestoreData>('/users/v1/session/restore', {
    method: 'POST',
    auth: 'none',
    dpop: true,
    credentials: 'include',
    headers: { 'x-gac-connection': connectionId },
  });
  setUsersSession(data);
  return data;
}
