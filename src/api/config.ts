const DEFAULT_API_BASE_URL = 'https://api.gacarbla.es';
const DEFAULT_WS_URL = 'wss://api.gacarbla.es/ws';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * La URL de la API se usa tanto para `fetch` como para el `htu` de DPoP.
 * No debe construirse con `location.origin`.
 */
export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
);

export const WS_URL = import.meta.env.VITE_WS_URL ?? DEFAULT_WS_URL;

export const IS_PRODUCTION = import.meta.env.PROD;
