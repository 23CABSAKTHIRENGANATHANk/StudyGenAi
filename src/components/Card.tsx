import { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  accent?: boolean;
}

export default function Card({ title, children, accent = false }: CardProps) {
  return (
    <section className={`rounded-[28px] border ${accent ? 'border-violet-400/25 bg-violet-500/5' : 'border-white/10 bg-slate-950/70'} p-6 shadow-xl shadow-slate-950/20`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}
