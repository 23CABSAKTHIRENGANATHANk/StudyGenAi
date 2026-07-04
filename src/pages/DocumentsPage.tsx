import { useState } from 'react';
import FileUpload from '../components/FileUpload';

export default function DocumentsPage() {
  const [fileName, setFileName] = useState('');

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Document manager</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Your uploaded study materials</h1>
            <p className="mt-3 text-slate-300">Upload PDF, DOCX, or PPTX files and generate AI study content instantly.</p>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
          <FileUpload />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4].map((item) => (
          <article key={item} className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/10 transition hover:-translate-y-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Study Notes</h2>
                <p className="text-sm text-slate-400">Chemistry | 24 pages</p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">PDF</span>
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <p>Uploaded 2 days ago</p>
              <p>AI summary ready</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">Preview</button>
              <button className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">Generate</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
