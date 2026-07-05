import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, Loader2, BookOpen } from 'lucide-react';
import { apiJson } from '../lib/api';
import { NoteItem } from '../types';

interface NotesResponse {
  notes: NoteItem[];
}

const NOTE_TYPES = ['auto', 'summary', 'notes', 'custom'] as const;
type NoteType = typeof NOTE_TYPES[number];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Note Modal ────────────────────────────────────────────────────────────────

interface NoteModalProps {
  note: NoteItem | null;
  onClose: () => void;
  onSave: () => void;
}

function NoteModal({ note, onClose, onSave }: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NoteType>('notes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setType((note.type as NoteType) || 'notes');
    } else {
      setTitle('');
      setContent('');
      setType('notes');
    }
  }, [note]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body = JSON.stringify({ title, content, type });
      const res = note
        ? await apiJson(`/api/notes/${note.id}`, { method: 'PUT', body })
        : await apiJson('/api/notes', { method: 'POST', body });
      if (!res.ok) {
        setError(note ? 'Failed to update note.' : 'Failed to create note.');
      } else {
        onSave();
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
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {note ? 'Edit note' : 'Create note'}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {note ? 'Update your note' : 'Write a new note'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="note-title" className="block text-sm text-slate-400">
              Title
            </label>
            <input
              id="note-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/50"
              placeholder="Note title"
            />
          </div>

          <div>
            <label htmlFor="note-type" className="block text-sm text-slate-400">
              Type
            </label>
            <select
              id="note-type"
              value={type}
              onChange={(e) => setType(e.target.value as NoteType)}
              className="mt-1 w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/50"
            >
              {NOTE_TYPES.map((t) => (
                <option key={t} value={t} className="bg-slate-900">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="note-content" className="block text-sm text-slate-400">
              Content
            </label>
            <textarea
              id="note-content"
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full resize-none rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/50"
              placeholder="Write your note content here..."
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {note ? 'Saving…' : 'Creating…'}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {note ? 'Save changes' : 'Create note'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalNote, setModalNote] = useState<NoteItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiJson<NotesResponse>('/api/notes');
      if (!res.ok) {
        setError('Failed to load notes.');
      } else {
        setNotes(res.data?.notes ?? []);
      }
    } catch {
      setError('Network error loading notes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await apiJson(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } else {
        alert('Delete failed. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  function openCreateModal() {
    setModalNote(null);
    setIsModalOpen(true);
  }

  function openEditModal(note: NoteItem) {
    setModalNote(note);
    setIsModalOpen(true);
  }

  return (
    <>
      {isModalOpen && (
        <NoteModal
          note={modalNote}
          onClose={() => setIsModalOpen(false)}
          onSave={loadNotes}
        />
      )}

      <div className="space-y-8">
        {/* Header */}
        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Note manager</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Your study notes</h1>
              <p className="mt-3 text-slate-300">
                Create, edit, and organize your notes. All your ideas in one place.
              </p>
            </div>
            {!loading && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300 ring-1 ring-white/10">
                <BookOpen className="h-4 w-4 text-violet-400" />
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-3xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              <Plus className="h-4 w-4" />
              Create Note
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Notes grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-[28px] bg-slate-900/80 animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center gap-6 rounded-[32px] border border-white/10 bg-slate-950/80 py-20 text-center">
            <BookOpen className="h-14 w-14 text-slate-700" />
            <div>
              <p className="text-lg font-semibold text-white">No notes yet</p>
              <p className="mt-2 text-slate-400">Create your first note to get started.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-3xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              <Plus className="h-4 w-4" />
              Create Note
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
                    <p className="mt-1 text-sm text-slate-400">
                      {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                    {note.type}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  {note.content.length > 100 ? `${note.content.slice(0, 100)}…` : note.content}
                </p>

                <p className="mt-4 text-xs text-slate-500">
                  {formatDate(note.updated_at || note.created_at)}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => openEditModal(note)}
                    className="flex items-center gap-2 rounded-3xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 transition hover:bg-violet-500/20"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(note.id, note.title)}
                    disabled={deletingId === note.id}
                    className="flex items-center gap-2 rounded-3xl border border-red-500/10 bg-red-500/5 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/15 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === note.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
