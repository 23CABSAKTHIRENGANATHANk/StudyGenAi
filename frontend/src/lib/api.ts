import type { ApiResponse } from '../types';

const meta: Record<string, unknown> = import.meta as unknown as Record<string, unknown>;
const API_BASE = ((meta.env as Record<string, string> | undefined)?.VITE_API_URL ?? '').replace(/\/$/, '');

/** Build an API URL for both local proxy and separately deployed backends. */
export function apiUrl(path: string): string {
  return path.startsWith('http') ? path : `${API_BASE}${path}`;
}

type ApiOptions = RequestInit & { auth?: boolean };

export async function apiFetch(input: string, init: ApiOptions = {}): Promise<Response> {
  const { auth: _auth, ...rest } = init;
  const opts: RequestInit = { ...rest };

  // Attach Authorization header from localStorage token
  if (init.auth !== false) {
    const token = localStorage.getItem('access_token');
    if (token) {
      opts.headers = {
        ...(opts.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${token}`,
      };
    }
  }

  // Always include cookies for HttpOnly refresh token support
  if (opts.credentials === undefined) opts.credentials = 'include';

  return fetch(apiUrl(input), opts);
}

/**
 * Convenience wrapper that sets Content-Type: application/json
 * and parses the response body as JSON.
 * Do NOT use this for FormData/multipart — use apiFetch directly.
 */
export async function apiJson<T = unknown>(input: string, init: ApiOptions = {}): Promise<ApiResponse<T>> {
  const res = await apiFetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: text ? (JSON.parse(text) as T) : null };
  } catch {
    return { ok: res.ok, status: res.status, data: null };
  }
}

export default apiFetch;
