import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Sparkles, ShieldCheck, BrainCircuit, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 rounded-[40px] border border-white/10 bg-slate-950/80 p-10 shadow-glow backdrop-blur-xl">
        <header className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-2 text-sm text-violet-200 ring-1 ring-violet-500/20">
              <BrainCircuit className="h-4 w-4" />
              AI-powered study companion for students
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">Study smarter with AI-driven summaries, flashcards, quizzes, and document chat.</h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Upload your notes, slides, and documents. Generate study content instantly and stay organized with a premium dashboard built for modern learners.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/auth/signup"
                className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/app/documents"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20"
              >
                <FileText className="h-4 w-4" />
                Open Documents
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/25">
            <div className="grid gap-6">
              <div className="rounded-[28px] bg-slate-950/90 p-6 ring-1 ring-white/5">
                <p className="text-sm uppercase text-slate-500">Live study insights</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">AI docs + smart planner</h2>
                <p className="mt-3 text-slate-400">Track progress, upload documents, and generate study guides with one secure dashboard.</p>
              </div>
              <div className="grid gap-4 rounded-[28px] bg-slate-950/95 p-6 ring-1 ring-white/5">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Weekly time</span>
                  <span className="text-white font-semibold">12h 30m</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-4/5 rounded-full bg-violet-400" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            { title: 'Document AI', subtitle: 'Summaries, notes, quizzes, flashcards.', icon: Layers },
            { title: 'Smart Planner', subtitle: 'Goals, reminders, progress tracking.', icon: ShieldCheck },
            { title: 'Secure workflow', subtitle: 'Supabase auth, storage, and vector search.', icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/15 transition hover:-translate-y-1 hover:bg-white/10">
                <Icon className="h-7 w-7 text-violet-400" />
                <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-slate-300">{item.subtitle}</p>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
