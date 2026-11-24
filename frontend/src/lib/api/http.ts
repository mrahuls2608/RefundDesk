import type { ApiErrorBody } from './types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

/** Every failed request becomes an ApiError carrying the backend's `{ code, message, traceId }`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly traceId: string | null,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static network(): ApiError {
    return new ApiError(0, 'NETWORK_ERROR', "Can't reach the server. Check your connection and try again.", null);
  }
}

type TokenProvider = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: TokenProvider = () => null;
let onUnauthorized: UnauthorizedHandler = () => undefined;

export function configureHttp(options: { getToken: TokenProvider; onUnauthorized: UnauthorizedHandler }): void {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Login must not trigger the global logout on 401. */
  skipAuthRedirect?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${toQueryString(options.query)}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw ApiError.network();
  }

  if (response.status === 401 && !options.skipAuthRedirect) onUnauthorized();
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  const traceId = response.headers.get('X-Trace-Id');
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    return new ApiError(response.status, body.code ?? 'INTERNAL_ERROR', body.message ?? 'Something went wrong', body.traceId ?? traceId, body.fields);
  } catch {
    return new ApiError(response.status, 'INTERNAL_ERROR', 'Something went wrong', traceId);
  }
}

function toQueryString(query?: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}
