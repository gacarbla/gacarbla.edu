import { WS_URL } from '../api/config';
import { ApiError, type ApiErrorPayload } from '../api/errors';
import { getOrCreateDeviceKey, type DeviceKey } from './device';

export interface HelloData {
  serverHpkePubB64: string;
  nonce: string;
  windowId: string;
  deviceJkt: string;
  connectionId: string;
}

interface WsEventFrame {
  type: 'event';
  route: string;
  data?: unknown;
}

interface WsResponseFrame {
  id: string;
  route?: string;
  ok: boolean;
  data?: unknown;
  error?: ApiErrorPayload;
  resolvedVersion?: string;
}

type WsFrame = WsEventFrame | WsResponseFrame;
type WsEventListener = (frame: WsEventFrame) => void;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

const REQUEST_TIMEOUT_MS = 10_000;
const NONCE_WINDOW_MS = 4 * 60 * 1000;

export class WsClient {
  private socket: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;
  private helloPromise: Promise<HelloData> | null = null;
  private helloData: HelloData | null = null;
  private nonceExpiresAt = 0;
  private deviceKey: DeviceKey | null = null;
  private pending = new Map<string, PendingRequest>();
  private listeners = new Set<WsEventListener>();

  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) return;
    if (this.connectPromise) return this.connectPromise;

    const promise = new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(WS_URL);
      this.socket = socket;
      let settled = false;

      const fail = (code: string, message: string): void => {
        if (settled) return;
        settled = true;
        this.connectPromise = null;
        reject(new ApiError({ code, message }));
      };

      socket.addEventListener('message', (event) => this.handleMessage(event));
      socket.addEventListener('close', () => {
        this.handleClose();
        fail('WS_CLOSED', 'La conexión con el servidor se ha cerrado.');
      });
      socket.addEventListener('error', () => {
        fail('WS_UNAVAILABLE', 'No se pudo abrir el WebSocket.');
      });

      socket.addEventListener(
        'open',
        () => {
          settled = true;
          this.connectPromise = null;
          resolve();
        },
        { once: true },
      );
    });

    this.connectPromise = promise;
    return promise;
  }

  async request<T>(route: string, data: Record<string, unknown> = {}): Promise<T> {
    await this.connect();
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new ApiError({ code: 'WS_CLOSED', message: 'La conexión con el servidor está cerrada.' });
    }

    const id = crypto.randomUUID();
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new ApiError({ code: 'WS_TIMEOUT', message: 'El servidor no respondió a tiempo.' }));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });

      socket.send(JSON.stringify({ id, route, data }));
    });
  }

  async hello(force = false): Promise<HelloData> {
    if (!force && this.helloData && Date.now() < this.nonceExpiresAt) return this.helloData;
    if (this.helloPromise) {
      if (!force) return this.helloPromise;
      await this.helloPromise.catch(() => undefined);
    }

    const promise = (async () => {
      const device = await this.getDevice();
      const hello = await this.request<HelloData>('core/v1/hello', { deviceJwk: device.publicJwk });
      this.helloData = hello;
      this.nonceExpiresAt = Date.now() + NONCE_WINDOW_MS;
      return hello;
    })();

    this.helloPromise = promise;
    try {
      return await promise;
    } finally {
      this.helloPromise = null;
    }
  }

  async ensureNonce(force = false): Promise<string> {
    return (await this.hello(force)).nonce;
  }

  async getDevice(): Promise<DeviceKey> {
    if (!this.deviceKey) this.deviceKey = await getOrCreateDeviceKey();
    return this.deviceKey;
  }

  get connectionId(): string | null {
    return this.helloData?.connectionId ?? null;
  }

  get helloInfo(): HelloData | null {
    return this.helloData;
  }

  onEvent(listener: WsEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close(): void {
    this.socket?.close();
    this.socket = null;
    this.helloData = null;
    this.nonceExpiresAt = 0;
    this.rejectPending(new ApiError({ code: 'WS_CLOSED', message: 'La conexión se ha cerrado.' }));
  }

  private handleMessage(event: MessageEvent): void {
    let frame: WsFrame;
    try {
      frame = JSON.parse(String(event.data)) as WsFrame;
    } catch {
      return;
    }

    if ('type' in frame && frame.type === 'event') {
      this.listeners.forEach((listener) => listener(frame));
      return;
    }

    if (!('id' in frame) || !frame.id) return;
    const pending = this.pending.get(frame.id);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pending.delete(frame.id);

    if (frame.ok) {
      pending.resolve(frame.data);
    } else {
      pending.reject(
        new ApiError(
          frame.error ?? { code: 'WS_ERROR', message: 'El servidor devolvió un error.' },
        ),
      );
    }
  }

  private handleClose(): void {
    this.socket = null;
    this.helloData = null;
    this.nonceExpiresAt = 0;
    this.rejectPending(new ApiError({ code: 'WS_CLOSED', message: 'La conexión se ha cerrado.' }));
  }

  private rejectPending(error: ApiError): void {
    this.pending.forEach((pending) => {
      clearTimeout(pending.timer);
      pending.reject(error);
    });
    this.pending.clear();
  }
}

export const wsClient = new WsClient();
