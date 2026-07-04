import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

interface AuthContextType {
  session: any;
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        // Attempt to restore session via HttpOnly refresh cookie on the backend
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        if (res.ok) {
          const j = await res.json()
          const access = j?.result?.access_token || j?.access_token
          const userData = j?.result?.user || j?.user
          if (access) {
            localStorage.setItem('access_token', access)
            // Rotate refresh every 14 minutes
            _startRefreshInterval()
          }
          setSession(userData || null)
          setUser(userData || null)
        } else {
          // Fall back to Supabase client SDK session (e.g. OAuth flows)
          const { data } = await supabase.auth.getSession()
          setSession(data.session)
          setUser(data.session?.user ?? null)
        }
      } catch {
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
        setUser(data.session?.user ?? null)
      } finally {
        setLoading(false)
      }
    })()

    // Keep in sync with Supabase client-side auth state changes (OAuth, magic links)
    const { data } = supabase.auth.onAuthStateChange((_event: string, newSession: any) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })
    const subscription = (data as any)?.subscription ?? data
    return () => {
      try { subscription?.unsubscribe?.() } catch { /* ignore */ }
      _stopRefreshInterval()
    }
  }, [])

  async function signOut() {
    try {
      const token = localStorage.getItem('access_token')
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
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
  ;(window as any).__studygen_refresh_interval = setInterval(() => {
    fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).then(r => r.ok && r.json()).then(j => {
      const access = j?.result?.access_token || j?.access_token
      if (access) localStorage.setItem('access_token', access)
    }).catch(() => {})
  }, 14 * 60 * 1000) as unknown as number
}

function _stopRefreshInterval() {
  try {
    const id = (window as any).__studygen_refresh_interval
    if (id) clearInterval(id)
    delete (window as any).__studygen_refresh_interval
  } catch { /* ignore */ }
}
