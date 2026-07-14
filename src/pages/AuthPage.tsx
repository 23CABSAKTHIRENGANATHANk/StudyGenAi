import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { LoginForm, SignupForm } from '../ui';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:py-12 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl rounded-3xl sm:rounded-[32px] border border-white/10 bg-slate-950/80 p-4 sm:p-8 shadow-glow backdrop-blur-xl">
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-2xl sm:rounded-[32px] border border-white/10 bg-white/5 p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
            <div className="hidden lg:block mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">StudyGen AI</p>
              <h1 className="mt-4 text-3xl font-semibold text-white">Sign in to continue learning faster.</h1>
            </div>
            <nav className="flex lg:flex-col w-full gap-2 sm:gap-3">
              <NavLink 
                to="/auth/login" 
                className={({ isActive }) => 
                  `flex-1 lg:flex-none text-center lg:text-left rounded-2xl sm:rounded-3xl px-4 py-2.5 sm:px-5 sm:py-3 text-sm transition ${
                    isActive 
                      ? 'bg-violet-500/10 text-white border border-violet-500/20' 
                      : 'text-slate-400 hover:bg-slate-900/70 border border-transparent'
                  }`
                }
              >
                Login
              </NavLink>
              <NavLink 
                to="/auth/signup" 
                className={({ isActive }) => 
                  `flex-1 lg:flex-none text-center lg:text-left rounded-2xl sm:rounded-3xl px-4 py-2.5 sm:px-5 sm:py-3 text-sm transition ${
                    isActive 
                      ? 'bg-violet-500/10 text-white border border-violet-500/20' 
                      : 'text-slate-400 hover:bg-slate-900/70 border border-transparent'
                  }`
                }
              >
                Sign up
              </NavLink>
            </nav>
          </aside>
          <div className="rounded-2xl sm:rounded-[32px] border border-white/10 bg-slate-900/80 p-5 sm:p-8">
            <Routes>
              <Route path="login" element={<LoginForm />} />
              <Route path="signup" element={<SignupForm />} />
              <Route path="*" element={<Navigate to="login" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
