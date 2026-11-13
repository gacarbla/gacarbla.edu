import { toBase64Url, sha256 } from './base64';

export interface DeviceKey {
  keyPair: CryptoKeyPair;
  publicJwk: JsonWebKey;
  jkt: string;
}

const DB_NAME = 'gacarbla-device';
const STORE_NAME = 'keys';
const RECORD_ID = 'device';

let memoryKey: DeviceKey | null = null;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function computeJkt(publicJwk: JsonWebKey): Promise<string> {
  const canonical = JSON.stringify({
    crv: publicJwk.crv,
    kty: publicJwk.kty,
    x: publicJwk.x,
    y: publicJwk.y,
  });
  return toBase64Url(await sha256(canonical));
}

async function createDeviceKey(): Promise<DeviceKey> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('WebCrypto no está disponible en este contexto.');
  }

  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign', 'verify'],
  );
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return { keyPair, publicJwk, jkt: await computeJkt(publicJwk) };
}

export async function getOrCreateDeviceKey(): Promise<DeviceKey> {
  if (memoryKey) return memoryKey;

  try {
    const db = await openDb();
    const stored = await new Promise<DeviceKey | undefined>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(RECORD_ID);
      request.onsuccess = () => resolve(request.result as DeviceKey | undefined);
      request.onerror = () => reject(request.error);
    });
    db.close();

    if (stored?.keyPair && stored.publicJwk) {
      return { ...stored, jkt: await computeJkt(stored.publicJwk) };
    }

    const created = await createDeviceKey();
    const writable = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = writable.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({ id: RECORD_ID, ...created });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    writable.close();
    return created;
  } catch {
    // IndexedDB puede fallar en modo privado o con permisos restringidos.
    // La sesión sigue funcionando, pero se pierde al recargar.
    memoryKey = await createDeviceKey();
    return memoryKey;
  }
}

export async function clearDeviceKey(): Promise<void> {
  memoryKey = null;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(RECORD_ID);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch {
    // Sin almacenamiento no hay nada persistido que borrar.
  }
}
