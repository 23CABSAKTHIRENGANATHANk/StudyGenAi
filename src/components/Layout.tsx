import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Sparkles, FileText, BookOpen, Layers, ClipboardList, CalendarDays, MessageSquare, Menu, X } from 'lucide-react';
import { LogoutButton } from '../ui';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        
        {/* Mobile Header */}
        <header className="flex lg:hidden items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-glow mb-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-400/20">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">StudyGen AI</p>
              <p className="text-xs text-slate-300">Workspace</p>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="rounded-xl p-2 border border-white/10 bg-slate-950 text-slate-300 transition hover:bg-white/5 hover:text-white"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in" 
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Drawer Panel */}
            <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-slate-950 p-6 flex flex-col justify-between shadow-2xl transition-transform animate-slide-in">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-400/20">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">StudyGen AI</p>
                      <p className="text-sm font-semibold text-white">Student Workspace</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-8 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/app'}
                        onClick={() => setIsMenuOpen(false)}
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
              </div>

              <div className="mt-6 border-t border-white/10 pt-6">
                <LogoutButton />
              </div>
            </aside>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[280px_1fr]">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl lg:sticky lg:top-6 lg:self-start">
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
            <div className="rounded-3xl sm:rounded-[32px] border border-white/10 bg-white/5 p-4 sm:p-6 shadow-glow backdrop-blur-xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
