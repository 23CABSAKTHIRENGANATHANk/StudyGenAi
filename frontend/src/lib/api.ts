import type { ApiResponse } from '../types';

// MUST use import.meta.env.VITE_* directly for Vite's static build-time replacement
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '');

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

  const fullUrl = apiUrl(input);
  
  // Log API calls in development
  if (import.meta.env.DEV) {
    console.log(`[API] ${opts.method || 'GET'} ${fullUrl}`);
  }

  try {
    const res = await fetch(fullUrl, opts);
    
    // Log response status in development
    if (import.meta.env.DEV) {
      console.log(`[API] Response: ${res.status}`);
    }
    
    return res;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`[API] Fetch error: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[API] URL was: ${fullUrl}`);
      const configured = API_BASE || '(using Vite dev proxy)';
      console.error(`[API] Is backend reachable at ${configured}? If deployed, set VITE_API_URL to your backend host.`);
    }
    throw error;
  }
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

/** Safe extractor for backend error detail strings. */
export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred.'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const dict = err as Record<string, unknown>;
    // If it's a wrapper object containing 'detail'
    if ('detail' in dict && dict.detail !== undefined) {
      return getErrorMessage(dict.detail, fallback);
    }
    // If it's the raw GoTrue/Supabase error dict with 'msg' or 'message'
    const msg = dict.msg || dict.message;
    if (typeof msg === 'string') return msg;

    // Otherwise serialize
    try {
      return JSON.stringify(err);
    } catch {
      return fallback;
    }
  }
  return String(err);
}

export default apiFetch;
