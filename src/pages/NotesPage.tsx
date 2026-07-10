import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen, Trash2, Plus, X, Loader2, Pencil, FileText
} from 'lucide-react';
import Card from '../components/Card';
import { apiJson } from '../lib/api';
import type { NoteItem } from '../types';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface NoteModalProps {
  note?: NoteItem | null;
  onClose: () => void;
  onSaved: () => void;
}

function NoteModal({ note, onClose, onSaved }: NoteModalProps) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [type, setType] = useState(note?.type ?? 'auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(note);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = isEdit ? `/api/notes/${note!.id}` : '/api/notes';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await apiJson(url, {
        method,
        body: JSON.stringify({ title, content, type }),
      });
      if (!res.ok) {
        setError((res.data as Record<string, unknown>)?.detail as string || 'Failed to save note.');
      } else {
        onSaved();
        onClose();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{isEdit ? 'Edit Note' : 'New Note'}</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{isEdit ? 'Update your note' : 'Create a new note'}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <label className="space-y-2 text-sm text-slate-200">
            <span>Title</span>
            <input
              type="text"
              value={title}
              required
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-200">
            <span>Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60"
            >
              <option value="auto">Auto</option>
              <option value="summary">Summary</option>
              <option value="notes">Notes</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-200">
            <span>Content</span>
            <textarea
              value={content}
              required
              rows={6}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60 resize-none"
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {isEdit ? 'Update Note' : 'Create Note'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalNote, setModalNote] = useState<NoteItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiJson('/api/notes');
      if (!res.ok) {
        setError('Failed to load notes.');
      } else {
        setNotes((res.data as { notes: NoteItem[] })?.notes ?? []);
      }
    } catch {
      setError('Network error loading notes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await apiJson(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== id));
      } else {
        alert('Delete failed. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    }
  }

  return (
    <div className="space-y-8">
      {(showCreate || modalNote) && (
        <NoteModal
          note={modalNote}
          onClose={() => { setShowCreate(false); setModalNote(null); }}
          onSaved={loadNotes}
        />
      )}

      <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Note manager</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Your study notes</h1>
            <p className="mt-3 text-slate-300">
              Create, edit, and organise your study notes and AI-generated summaries.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-3xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-48 rounded-[28px] bg-slate-900/80 animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center gap-6 rounded-[32px] border border-white/10 bg-slate-950/80 py-20 text-center">
          <BookOpen className="h-14 w-14 text-slate-700" />
          <div>
            <p className="text-lg font-semibold text-white">No notes yet</p>
            <p className="mt-2 text-slate-400">Create your first note or generate one from a document.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            Create a note
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <article
              key={note.id}
              className="group rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/10 transition hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-white">{note.title}</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{note.type}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {note.type}
                </span>
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-400">
                {note.content}
              </p>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>{formatDate(note.updated_at)}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setModalNote(note)}
                  className="flex items-center gap-2 rounded-3xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 transition hover:bg-violet-500/20"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(note.id, note.title)}
                  className="flex items-center gap-2 rounded-3xl border border-red-500/10 bg-red-500/5 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
