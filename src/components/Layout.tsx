import { NavLink, Outlet } from 'react-router-dom';
import { Menu, Sparkles, FileText, User, Circle } from 'lucide-react';
import LogoutButton from '../ui/LogoutButton';

  const navItems = [
  { to: '/app', label: 'Dashboard', icon: Sparkles },
  { to: '/app/documents', label: 'Documents', icon: FileText },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">StudyGen AI</p>
                <h1 className="mt-2 text-2xl font-semibold">Student Workspace</h1>
              </div>
              <Menu className="h-6 w-6 text-slate-300" />
            </div>
            <nav className="mt-10 space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm transition ${
                        isActive ? 'border-indigo-400/40 bg-indigo-500/10 text-white' : 'border-white/5 text-slate-300 hover:border-white/15 hover:bg-white/5'
                        }`}
                      >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
              <div className="mt-4">
                <LogoutButton />
              </div>
            </nav>
          </aside>

          <main>
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
