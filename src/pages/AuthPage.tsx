import { NavLink, Route, Routes } from 'react-router-dom';
import LoginForm from '../ui/LoginForm';
import SignupForm from '../ui/SignupForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-8 rounded-[32px] border border-white/10 bg-white/5 p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">StudyGen AI</p>
              <h1 className="mt-4 text-3xl font-semibold text-white">Sign in to continue learning faster.</h1>
            </div>
            <nav className="space-y-3">
              <NavLink to="login" className={({ isActive }) => `block rounded-3xl px-5 py-3 text-sm transition ${isActive ? 'bg-violet-500/10 text-white' : 'text-slate-300 hover:bg-slate-900/70'}`}>
                Login
              </NavLink>
              <NavLink to="signup" className={({ isActive }) => `block rounded-3xl px-5 py-3 text-sm transition ${isActive ? 'bg-violet-500/10 text-white' : 'text-slate-300 hover:bg-slate-900/70'}`}>
                Sign up
              </NavLink>
            </nav>
          </aside>
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8">
            <Routes>
              <Route path="login" element={<LoginForm />} />
              <Route path="signup" element={<SignupForm />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
