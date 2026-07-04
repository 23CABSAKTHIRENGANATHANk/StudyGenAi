import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthProvider'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/auth/login')
  }

  return (
    <button
      id="logout-button"
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-3xl border border-white/5 px-4 py-3 text-sm text-slate-400 transition hover:border-white/15 hover:bg-white/5 hover:text-slate-200"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  )
}
