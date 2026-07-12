import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { apiUrl } from '../lib/api';

function hasBackend(): boolean {
  return ((import.meta.env.VITE_API_URL as string | undefined) ?? '').trim() !== '';
}

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      if (hasBackend()) {
        // Use the custom backend signup endpoint when a backend is configured
        const res = await fetch(apiUrl('/api/auth/signup'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const j = await res.json();
        if (!res.ok) {
          setError(j.detail || 'Signup failed. Please try again.');
          return;
        }
      } else {
        // Direct Supabase auth (no backend required)
        const { error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) {
          setError(authError.message || 'Signup failed. Please try again.');
          return;
        }
      }
      // Supabase may require email confirmation
      setSuccess(
        'Account created! Check your email to confirm your address, then sign in.'
      );
      setTimeout(() => navigate('/auth/login'), 3000);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Create account</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Get started with StudyGen AI</h2>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="space-y-2 text-sm text-slate-200">
          <span>Email</span>
          <input
            id="signup-email"
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
            id="signup-password"
            type="password"
            value={password}
            required
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-200">
          <span>Confirm password</span>
          <input
            id="signup-confirm-password"
            type="password"
            value={confirmPassword}
            required
            autoComplete="new-password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60"
          />
        </label>
        <button
          id="signup-submit"
          type="submit"
          disabled={loading}
          className="rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="../login" className="text-violet-300 hover:text-violet-200">
          Sign in
        </Link>
      </p>
    </div>
  );
}
