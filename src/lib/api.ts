type ApiOptions = RequestInit & { auth?: boolean }

export async function apiFetch(input: string, init: ApiOptions = {}) {
  const opts: RequestInit = { ...init }
  // attach Authorization header if requested
  if (init.auth !== false) {
    const token = localStorage.getItem('access_token')
    if (token) {
      opts.headers = { ...(opts.headers as any), Authorization: `Bearer ${token}` }
    }
  }
  // default credentials: include when not explicitly set to omit
  if (opts.credentials === undefined) opts.credentials = 'include'
  const res = await fetch(input, opts)
  return res
}

export async function apiJson(input: string, init: ApiOptions = {}) {
  const res = await apiFetch(input, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } })
  const text = await res.text()
  try {
    return { ok: res.ok, status: res.status, json: text ? JSON.parse(text) : null }
  } catch (e) {
    return { ok: res.ok, status: res.status, json: null }
  }
}

export default apiFetch
