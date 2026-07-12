import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { apiUrl } from './api'
import type { User, AuthContextType } from '../types'

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

/** Whether a deployed backend API URL is configured */
function hasBackend(): boolean {
  const meta: any = import.meta
  const apiBase = (meta.env?.VITE_API_URL as string | undefined) ?? ''
  return apiBase.trim() !== ''
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<User | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        if (hasBackend()) {
          // Attempt to restore session via HttpOnly refresh cookie on the backend
          const res = await fetch(apiUrl('/api/auth/refresh'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
          if (res.ok) {
            const j = await res.json() as Record<string, unknown>
            const result = j?.result as Record<string, unknown> | undefined
            const access = (result?.access_token as string | undefined) || (j?.access_token as string | undefined)
            const userData = (result?.user as User | undefined) || (j?.user as User | undefined)
            if (access) {
              localStorage.setItem('access_token', access)
              // Rotate refresh every 14 minutes
              _startRefreshInterval()
            }
            setSession(userData || null)
            setUser(userData || null)
            return
          }
        }
        // Fall back to Supabase client SDK session (OAuth flows / magic links)
        const { data } = await supabase.auth.getSession()
        const supaUser = data.session?.user as unknown as User | undefined
        setSession(supaUser || null)
        setUser(supaUser || null)
      } catch {
        // Network error or any unexpected failure — gracefully degrade
        try {
          const { data } = await supabase.auth.getSession()
          const supaUser = data.session?.user as unknown as User | undefined
          setSession(supaUser || null)
          setUser(supaUser || null)
        } catch {
          setSession(null)
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    })()

    // Keep in sync with Supabase client-side auth state changes (OAuth, magic links)
    const { data } = supabase.auth.onAuthStateChange((_event: string, newSession: { user?: User | null } | null) => {
      const supaUser = newSession?.user as unknown as User | undefined
      setSession(supaUser || null)
      setUser(supaUser || null)
    })
    const subscription = data?.subscription
    return () => {
      try { subscription?.unsubscribe?.() } catch { /* ignore */ }
      _stopRefreshInterval()
    }
  }, [])

  async function signOut() {
    try {
      if (hasBackend()) {
        const token = localStorage.getItem('access_token')
        await fetch(apiUrl('/api/auth/logout'), {
          method: 'POST',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
      }
    } catch { /* ignore network errors */ }
    localStorage.removeItem('access_token')
    _stopRefreshInterval()
    await supabase.auth.signOut().catch(() => {})
    setSession(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Token refresh helpers ──────────────────────────────────────────────────

function _startRefreshInterval() {
  _stopRefreshInterval()
  window.__studygen_refresh_interval = setInterval(() => {
    fetch(apiUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).then(r => r.ok && r.json()).then((j: unknown) => {
      const result = (j as Record<string, unknown>)?.result as Record<string, unknown> | undefined
      const access = (result?.access_token as string | undefined) || ((j as Record<string, unknown>)?.access_token as string | undefined)
      if (access) localStorage.setItem('access_token', access)
    }).catch(() => {})
  }, 14 * 60 * 1000) as unknown as number
}

function _stopRefreshInterval() {
  try {
    const id = window.__studygen_refresh_interval
    if (id) clearInterval(id)
    delete window.__studygen_refresh_interval
  } catch { /* ignore */ }
}
