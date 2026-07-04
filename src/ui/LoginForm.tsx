import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/server-login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const j = await res.json()
      if (!res.ok) {
        alert(j.detail || 'Login failed')
        return
      }
      const access = j?.access_token || j?.result?.access_token
      if (access) {
        localStorage.setItem('access_token', access)
        // kick off background refresh
        try { (window as any).__studygen_refresh_interval && clearInterval((window as any).__studygen_refresh_interval) } catch(e) {}
        ;(window as any).__studygen_refresh_interval = setInterval(() => {
          fetch('/api/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        }, 14 * 60 * 1000) as unknown as number
      }
      navigate('/app')
    } catch (e) {
      alert('Login error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Member access</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Login to your account</h2>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="space-y-2 text-sm text-slate-200">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-200">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60"
          />
        </label>
        <button type="submit" className="rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400">
          Continue
        </button>
      </form>
      <p className="text-sm text-slate-400">Forgot your password? <a href="#" className="text-violet-300 hover:text-violet-200">Reset here</a>.</p>
    </div>
  );
}
