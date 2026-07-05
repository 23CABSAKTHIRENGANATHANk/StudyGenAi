import { NavLink, Outlet } from 'react-router-dom';
import { Sparkles, FileText, BookOpen, Layers, ClipboardList, CalendarDays, MessageSquare, Bell } from 'lucide-react';
import { LogoutButton } from '../ui';

export default function Layout() {
  const navItems = [
    { to: '/app', label: 'Dashboard', icon: Sparkles },
    { to: '/app/documents', label: 'Documents', icon: FileText },
    { to: '/app/notes', label: 'Notes', icon: BookOpen },
    { to: '/app/flashcards', label: 'Flashcards', icon: Layers },
    { to: '/app/quizzes', label: 'Quizzes', icon: ClipboardList },
    { to: '/app/study-planner', label: 'Study Planner', icon: CalendarDays },
    { to: '/app/chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-400/20">
                <Sparkles className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">StudyGen AI</p>
                <p className="text-sm font-semibold text-white">Student Workspace</p>
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/app'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                        isActive
                          ? 'border-violet-400/40 bg-violet-500/10 text-white'
                          : 'border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-white/10 pt-6">
              <LogoutButton />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
