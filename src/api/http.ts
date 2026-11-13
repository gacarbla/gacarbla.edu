import { createDpopProof } from '../auth/dpop';
import { session } from '../auth/session';
import { wsClient } from '../auth/ws';
import { API_BASE_URL } from './config';
import { ApiError, isDpopRetryable, type ApiErrorPayload } from './errors';

export type AuthKind = 'none' | 'users' | 'edu';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: AuthKind;
  /** Fuerza o desactiva DPoP; por defecto se activa si hay auth. */
  dpop?: boolean;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
}

interface Envelope<T> {
  ok: boolean;
  data?: T;
  error?: ApiErrorPayload;
}

function accessTokenFor(auth: AuthKind): string | undefined {
  if (auth === 'users') return session.users?.accessToken;
  if (auth === 'edu') return session.edu?.accessToken;
  return undefined;
}

async function execute<T>(
  path: string,
  options: RequestOptions,
  allowRetry: boolean,
  raw = false,
): Promise<T> {
  const method = options.method ?? 'GET';
  const auth = options.auth ?? 'none';
  const accessToken = accessTokenFor(auth);
  if (auth !== 'none' && !accessToken) {
    throw new ApiError({ code: 'AUTH_REQUIRED', message: 'Falta la sesión para esta operación.' }, 401);
  }

  const useDpop = options.dpop ?? auth !== 'none';
  let proof: string | undefined;
  if (useDpop) {
    const device = await wsClient.getDevice();
    proof = await createDpopProof({
      keyPair: device.keyPair,
      publicJwk: device.publicJwk,
      htu: `${API_BASE_URL}${path.split('?')[0] ?? path}`,
      htm: method,
      nonce: await wsClient.ensureNonce(),
      accessToken,
    });
  }

  const headers: Record<string, string> = {
    accept: 'application/json',
    ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
    ...(accessToken ? { authorization: `DPoP ${accessToken}` } : {}),
    ...(proof ? { dpop: proof } : {}),
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: options.credentials ?? 'omit',
      signal: options.signal,
    });
  } catch {
    throw new ApiError({ code: 'NETWORK_ERROR', message: 'No se pudo conectar con el servidor.' }, 0);
  }

  const body = (await response.json().catch(() => null)) as Envelope<T> | null;

  if (!response.ok || (!raw && !body?.ok)) {
    const error = new ApiError(
      body?.error ?? {
        code: `HTTP_${response.status}`,
        message: 'El servidor devolvió un error.',
      },
      response.status,
    );

    if (allowRetry && useDpop && response.status === 401 && isDpopRetryable(error)) {
      await wsClient.hello(true);
      return execute<T>(path, options, false, raw);
    }

    throw error;
  }

  return (raw ? (body as T) : (body?.data as T));
}

export function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return execute<T>(path, options, true);
}

/**
 * Igual que `apiRequest`, pero devuelve el cuerpo completo.
 *
 * Algunas rutas REST de la API no usan el sobre `{ ok, data }`: es el caso de
 * `GET /users/v1/me`, que responde directamente la vista (snake_case).
 */
export function apiRequestRaw<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return execute<T>(path, options, true, true);
}
