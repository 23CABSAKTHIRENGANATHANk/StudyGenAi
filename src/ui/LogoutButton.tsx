import { useNavigate } from 'react-router-dom'

export default function LogoutButton() {
  const navigate = useNavigate()
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('access_token')
    try { (window as any).__studygen_refresh_interval && clearInterval((window as any).__studygen_refresh_interval) } catch (e) {}
    navigate('/auth')
  }
  return (
    <button onClick={handleLogout} className="flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm transition text-slate-300 hover:border-white/15 hover:bg-white/5">
      Sign Out
    </button>
  )
}
