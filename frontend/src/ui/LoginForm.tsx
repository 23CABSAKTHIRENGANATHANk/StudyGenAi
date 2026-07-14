import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { apiUrl, getErrorMessage } from '../lib/api';

function hasBackend(): boolean {
  return true;
}

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (hasBackend()) {
        // Use the custom backend login endpoint when a backend is configured
        const res = await fetch(apiUrl('/api/auth/server-login'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const j = await res.json();
        if (!res.ok) {
          setError(getErrorMessage(j, 'Login failed. Check your credentials and try again.'));
          return;
        }
        const access = j?.access_token || j?.result?.access_token;
        const refresh = j?.refresh_token || j?.result?.refresh_token;
        if (access) {
          localStorage.setItem('access_token', access);
          if (refresh) {
            localStorage.setItem('refresh_token', refresh);
          }
          if (window.__studygen_refresh_interval) clearInterval(window.__studygen_refresh_interval as number);
          window.__studygen_refresh_interval = setInterval(() => {
            const currentRefresh = localStorage.getItem('refresh_token');
            fetch(apiUrl('/api/auth/refresh'), {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: currentRefresh || undefined }),
            });
          }, 14 * 60 * 1000) as unknown as number;
        }
      } else {
        // Direct Supabase auth (no backend required)
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          setError(authError.message || 'Login failed. Check your credentials and try again.');
          return;
        }
      }
      if (hasBackend()) {
        window.location.href = '/app';
      } else {
        navigate('/app');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Member access</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Login to your account</h2>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="space-y-2 text-sm text-slate-200">
          <span>Email</span>
          <input
            id="login-email"
            type="email"
            value={email}
            required
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-200">
          <span>Password</span>
          <input
            id="login-password"
            type="password"
            value={password}
            required
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60"
          />
        </label>
        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Continue'}
        </button>
      </form>
      <p className="text-sm text-slate-400">
        Don't have an account?{' '}
        <Link to="../signup" className="text-violet-300 hover:text-violet-200">
          Sign up
        </Link>
      </p>
    </div>
  );
}
