import { useCallback, useEffect, useState } from 'react';
import {
  Layers, Trash2, Plus, X, Loader2, Eye, EyeOff, ChevronLeft, ChevronRight, RotateCcw
} from 'lucide-react';
import Card from '../components/Card';
import { apiJson } from '../lib/api';
import type { FlashcardItem } from '../types';

interface FlashcardModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function FlashcardModal({ onClose, onSaved }: FlashcardModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiJson('/api/flashcards', {
        method: 'POST',
        body: JSON.stringify({ question, answer }),
      });
      if (!res.ok) {
        setError((res.data as Record<string, unknown>)?.detail as string || 'Failed to save flashcard.');
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
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">New Flashcard</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Create a flashcard</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <label className="space-y-2 text-sm text-slate-200">
            <span>Question</span>
            <textarea
              value={question}
              required
              rows={3}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60 resize-none"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-200">
            <span>Answer</span>
            <textarea
              value={answer}
              required
              rows={3}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400/60 resize-none"
            />
          </label>
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Plus className="h-4 w-4" /> Create Flashcard</>}
          </button>
        </form>
      </div>
    </div>
  );
}

interface StudyModeProps {
  cards: FlashcardItem[];
  onClose: () => void;
}

function StudyMode({ cards, onClose }: StudyModeProps) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (cards.length === 0) return null;
  const card = cards[index];

  function next() {
    setRevealed(false);
    setIndex(i => (i + 1) % cards.length);
  }

  function prev() {
    setRevealed(false);
    setIndex(i => (i - 1 + cards.length) % cards.length);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-400">Card {index + 1} of {cards.length}</p>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-900 p-10 text-center shadow-2xl min-h-[320px] flex flex-col items-center justify-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{revealed ? 'Answer' : 'Question'}</p>
          <p className="mt-6 text-2xl font-semibold text-white whitespace-pre-wrap">{revealed ? card.answer : card.question}</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button onClick={prev} className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setRevealed(r => !r)}
            className="flex items-center gap-2 rounded-3xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            {revealed ? <><EyeOff className="h-4 w-4" /> Hide</> : <><Eye className="h-4 w-4" /> Reveal</>}
          </button>
          <button onClick={next} className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiJson('/api/flashcards');
      if (!res.ok) {
        setError('Failed to load flashcards.');
      } else {
        setCards((res.data as { flashcards: FlashcardItem[] })?.flashcards ?? []);
      }
    } catch {
      setError('Network error loading flashcards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this flashcard?')) return;
    try {
      const res = await apiJson(`/api/flashcards/${id}`, { method: 'DELETE' });
      if (res.ok) setCards(prev => prev.filter(c => c.id !== id));
      else alert('Delete failed.');
    } catch {
      alert('Network error.');
    }
  }

  return (
    <div className="space-y-8">
      {showCreate && <FlashcardModal onClose={() => setShowCreate(false)} onSaved={loadCards} />}
      {studyMode && <StudyMode cards={cards} onClose={() => setStudyMode(false)} />}

      <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Flashcard deck</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Your flashcards</h1>
            <p className="mt-3 text-slate-300">Review, create, and study with AI-generated flashcards.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStudyMode(true)}
              disabled={cards.length === 0}
              className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Study Mode
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-3xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              <Plus className="h-4 w-4" />
              New Card
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">{error}</div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(i => <div key={i} className="h-48 rounded-[28px] bg-slate-900/80 animate-pulse" />)}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center gap-6 rounded-[32px] border border-white/10 bg-slate-950/80 py-20 text-center">
          <Layers className="h-14 w-14 text-slate-700" />
          <div>
            <p className="text-lg font-semibold text-white">No flashcards yet</p>
            <p className="mt-2 text-slate-400">Generate flashcards from a document or create your own.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-400">
            Create a flashcard
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article key={card.id} className="group rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/10 transition hover:-translate-y-1">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Question</p>
                <p className="mt-2 text-base font-medium text-white line-clamp-3">{card.question}</p>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Answer</p>
                <p className="mt-2 text-sm text-slate-300 line-clamp-3">{card.answer}</p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleDelete(card.id)}
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
