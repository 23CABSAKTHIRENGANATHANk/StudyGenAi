import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const j = await res.json()
      if (!res.ok) {
        alert(j.detail || 'Signup failed')
        return
      }
      navigate('/app');
    } catch (e) {
      alert('Signup error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Create account</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Get started with StudyGen AI</h2>
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
        <label className="space-y-2 text-sm text-slate-200">
          <span>Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60"
          />
        </label>
        <button type="submit" className="rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400">
          Create account
        </button>
      </form>
      <p className="text-sm text-slate-400">Already have an account? <a href="#" className="text-violet-300 hover:text-violet-200">Sign in</a>.</p>
    </div>
  );
}
