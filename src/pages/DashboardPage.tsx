import Card from '../components/Card';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Welcome back</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Your study dashboard</h1>
            <p className="mt-3 text-slate-300">Review your recent documents, AI usage, and planning insights in one place.</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full bg-white/5 px-5 py-3 text-sm text-slate-200 ring-1 ring-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Online and ready
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card title="Quick Actions" accent>
              <div className="grid gap-3 sm:grid-cols-2">
                {['Upload document', 'Generate summary', 'Create quiz', 'Chat with notes'].map((label) => (
                  <button key={label} className="rounded-3xl bg-white/5 px-4 py-4 text-left text-sm text-slate-200 transition hover:bg-white/10">
                    {label}
                  </button>
                ))}
              </div>
            </Card>
            <Card title="Usage Overview">
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Documents', value: '0' },
                  { label: 'Study minutes', value: '0' },
                  { label: 'AI requests', value: '0' },
                  { label: 'Flashcards', value: '0' },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          <Card title="Recent Documents">
            <div className="space-y-4">
              {[1, 2, 3].map((index) => (
                <div key={index} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Lecture notes</p>
                      <p className="text-lg font-semibold text-white">Study guide for semester</p>
                    </div>
                    <p className="text-sm text-slate-500">PDF</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Study Progress">
            <div className="space-y-5">
              {[
                { label: 'This week', value: '3.5h' },
                { label: 'Goal completion', value: '72%' },
                { label: 'Tasks completed', value: '5/8' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{item.label}</span>
                    <span className="text-white">{item.value}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-full w-3/4 rounded-full bg-violet-400" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Study Planner">
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="font-semibold text-white">Review chapter 4</p>
                <p className="mt-1 text-slate-400">Due today, 5:00 PM</p>
              </li>
              <li className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="font-semibold text-white">Create flashcards</p>
                <p className="mt-1 text-slate-400">AI-generated from uploaded notes</p>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
