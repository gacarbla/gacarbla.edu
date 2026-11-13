export interface ApiErrorPayload {
  code: string;
  message: string;
  traceId?: string;
  approvalId?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly traceId?: string;
  readonly approvalId?: string;
  readonly details?: unknown;

  constructor(payload: ApiErrorPayload, status = 0) {
    super(payload.message);
    this.name = 'ApiError';
    this.code = payload.code;
    this.status = status;
    this.traceId = payload.traceId;
    this.approvalId = payload.approvalId;
    this.details = payload.details;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

const DPOP_RETRYABLE_CODES = new Set([
  'DPOP_BAD_NONCE',
  'DPOP_STALE_IAT',
  'DPOP_BAD_ATH',
  'DPOP_REPLAY',
  'EDU_DPOP_INVALID',
]);

export function isDpopRetryable(error: unknown): boolean {
  return isApiError(error) && DPOP_RETRYABLE_CODES.has(error.code);
}

export function isApprovalPending(error: unknown): boolean {
  return isApiError(error) && (error.code === 'EDU_APPROVAL_PENDING' || error.code === 'EDU_APPROVAL_REQUIRED');
}
