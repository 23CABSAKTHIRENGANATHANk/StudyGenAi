import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext<any>(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // attempt to refresh session from server (HttpOnly cookie)
    (async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        if (res.ok) {
          const j = await res.json()
          const access = j?.result?.access_token || j?.access_token
          const user = j?.result?.user || j?.user
          if (access) {
            localStorage.setItem('access_token', access)
            // schedule background refresh every 14 minutes
            try { (window as any).__studygen_refresh_interval && clearInterval((window as any).__studygen_refresh_interval) } catch (e) {}
            ;(window as any).__studygen_refresh_interval = setInterval(() => {
              fetch('/api/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
            }, 14 * 60 * 1000) as unknown as number
          }
          setSession(user || null)
        } else {
          // fallback to supabase client session
          const s = await supabase.auth.getSession()
          setSession(s.data.session)
        }
      } catch (e) {
        const s = await supabase.auth.getSession()
        setSession(s.data.session)
      }
    })()
    const { data } = supabase.auth.onAuthStateChange((_event: string, newSession: any) => {
      setSession(newSession)
    })
    const subscription = (data as any)?.subscription ?? data
    return () => {
      try { subscription?.unsubscribe?.() } catch (e) {}
    }
  }, [])

  const value = { session }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
