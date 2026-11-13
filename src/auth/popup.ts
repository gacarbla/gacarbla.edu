import { API_BASE_URL } from '../api/config';

/** La ventana emergente no pudo abrirse (bloqueada por el navegador). */
export class PopupBlockedError extends Error {
  constructor() {
    super('El navegador bloqueó la ventana de acceso.');
    this.name = 'PopupBlockedError';
  }
}

/** La ventana se abrió pero se cerró sin confirmar el acceso. */
export class PopupClosedError extends Error {
  constructor() {
    super('La ventana se cerró antes de confirmar el acceso.');
    this.name = 'PopupClosedError';
  }
}

/**
 * URL oficial de acceso de api.gacarbla.es.
 *
 * `popup=1` hace que la ventana devuelva el control por `postMessage`; sin
 * ese parámetro, el flujo termina redirigiendo la pestaña a `returnTo`.
 */
export function buildUsersLoginUrl(returnTo: string, popup = true): string {
  const url = new URL(`${API_BASE_URL}/users/login`);
  if (popup) url.searchParams.set('popup', '1');
  url.searchParams.set('return', returnTo);
  return url.toString();
}

/**
 * Abre la ventana oficial de acceso y espera la confirmación.
 *
 * No recibimos tokens: la ventana deja una cookie HttpOnly y avisa de que el
 * login terminó. Después hay que restaurar la sesión con DPoP + WebSocket.
 */
export function openUsersLoginPopup(returnTo: string): Promise<void> {
  const popup = window.open(
    buildUsersLoginUrl(returnTo, true),
    'gacarbla-users-login',
    'popup=yes,width=480,height=720',
  );
  if (!popup) return Promise.reject(new PopupBlockedError());

  return new Promise<void>((resolve, reject) => {
    const expectedOrigin = new URL(API_BASE_URL).origin;
    let settled = false;

    const cleanup = (): void => {
      window.removeEventListener('message', onMessage);
      window.clearInterval(watcher);
      window.clearTimeout(timeout);
    };

    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };

    const onMessage = (event: MessageEvent): void => {
      if (event.origin !== expectedOrigin) return;
      const data = event.data as { type?: string; ok?: boolean } | null;
      if (!data || data.type !== 'gacarbla:auth') return;
      if (data.ok) finish();
      else finish(new Error('El acceso no se completó.'));
    };

    const watcher = window.setInterval(() => {
      if (!popup.closed) return;
      // El popup hace `postMessage` y cierra casi a la vez: damos un turno
      // al mensaje antes de darlo por cancelado.
      window.clearInterval(watcher);
      window.setTimeout(() => finish(new PopupClosedError()), 250);
    }, 400);

    const timeout = window.setTimeout(() => {
      popup.close();
      finish(new Error('El acceso tardó demasiado. Vuelve a intentarlo.'));
    }, 5 * 60 * 1000);

    window.addEventListener('message', onMessage);
  });
}

/**
 * Fallback: lleva esta pestaña al acceso oficial y vuelve a edu con
 * `auth=redirect`, para completar la sesión al cargar.
 */
export function redirectToUsersLogin(returnTo = window.location.href): void {
  const target = new URL(returnTo);
  target.searchParams.set('auth', 'redirect');
  window.location.assign(buildUsersLoginUrl(target.toString(), false));
}

/** ¿Venimos de completar el acceso con el fallback de redirect? */
export function isRedirectReturn(url = window.location.href): boolean {
  return new URL(url).searchParams.get('auth') === 'redirect';
}

/** Limpia el marcador de redirect sin recargar la página. */
export function clearRedirectMarker(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('auth')) return;
  url.searchParams.delete('auth');
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}
