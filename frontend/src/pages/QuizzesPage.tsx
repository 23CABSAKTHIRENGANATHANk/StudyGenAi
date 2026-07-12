import { useCallback, useEffect, useState } from 'react';
import {
  ClipboardList, Trash2, Plus, X, Loader2, Play, Trophy
} from 'lucide-react';
import Card from '../components/Card';
import { apiJson } from '../lib/api';
import type { QuizItem } from '../types';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface QuizModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function QuizModal({ onClose, onSaved }: QuizModalProps) {
  const [title, setTitle] = useState('');
  const [questionsText, setQuestionsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Parse simple questions format or store as raw text
      const questions = questionsText.split('\n').filter(q => q.trim()).map((q, i) => ({
        id: i,
        text: q.trim(),
        options: ['A', 'B', 'C', 'D'],
        correct: 'A'
      }));
      const res = await apiJson('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify({ title, questions }),
      });
      if (!res.ok) {
        setError((res.data as Record<string, unknown>)?.detail as string || 'Failed to create quiz.');
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
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">New Quiz</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Create a quiz</h2>
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
            <span>Questions (one per line)</span>
            <textarea
              value={questionsText}
              required
              rows={6}
              placeholder="What is the capital of France?&#10;Who wrote Romeo and Juliet?"
              onChange={(e) => setQuestionsText(e.target.value)}
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
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Plus className="h-4 w-4" /> Create Quiz</>}
          </button>
        </form>
      </div>
    </div>
  );
}

interface TakeQuizProps {
  quiz: QuizItem;
  onClose: () => void;
  onSubmitted: () => void;
}

function TakeQuiz({ quiz, onClose, onSubmitted }: TakeQuizProps) {
  const questions = Array.isArray(quiz.questions) ? quiz.questions as Array<{text?: string; options?: string[]; correct?: string}> : [];
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  function selectAnswer(qIdx: number, option: string) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: option }));
  }

  function submit() {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] && answers[i] === (q.correct || 'A')) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    // Submit result to backend
    apiJson('/api/quizzes/results', {
      method: 'POST',
      body: JSON.stringify({ quiz_id: quiz.id, score: correct, total: questions.length, answers }),
    }).catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-[32px] border border-white/10 bg-slate-900 p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Quiz</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{quiz.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-8 text-center">
            <Trophy className="mx-auto h-12 w-12 text-violet-400" />
            <p className="mt-4 text-3xl font-bold text-white">{score} / {questions.length}</p>
            <p className="mt-2 text-slate-400">You scored {Math.round((score / questions.length) * 100)}%</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-3xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {questions.map((q, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-sm font-medium text-white">{i + 1}. {q.text || 'Question'}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(q.options || ['A', 'B', 'C', 'D']).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => selectAnswer(i, opt)}
                      className={`rounded-2xl border px-4 py-3 text-sm text-left transition ${
                        answers[i] === opt
                          ? 'border-violet-400/50 bg-violet-500/10 text-white'
                          : 'border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={submit}
              disabled={Object.keys(answers).length < questions.length}
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Submit Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiJson('/api/quizzes');
      if (!res.ok) {
        setError('Failed to load quizzes.');
      } else {
        setQuizzes((res.data as { quizzes: QuizItem[] })?.quizzes ?? []);
      }
    } catch {
      setError('Network error loading quizzes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQuizzes(); }, [loadQuizzes]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await apiJson(`/api/quizzes/${id}`, { method: 'DELETE' });
      if (res.ok) setQuizzes(prev => prev.filter(q => q.id !== id));
      else alert('Delete failed.');
    } catch {
      alert('Network error.');
    }
  }

  return (
    <div className="space-y-8">
      {showCreate && <QuizModal onClose={() => setShowCreate(false)} onSaved={loadQuizzes} />}
      {activeQuiz && <TakeQuiz quiz={activeQuiz} onClose={() => setActiveQuiz(null)} onSubmitted={loadQuizzes} />}

      <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Quiz centre</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Your quizzes</h1>
            <p className="mt-3 text-slate-300">Test your knowledge with AI-generated quizzes.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-3xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            <Plus className="h-4 w-4" />
            New Quiz
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">{error}</div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(i => <div key={i} className="h-48 rounded-[28px] bg-slate-900/80 animate-pulse" />)}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex flex-col items-center gap-6 rounded-[32px] border border-white/10 bg-slate-950/80 py-20 text-center">
          <ClipboardList className="h-14 w-14 text-slate-700" />
          <div>
            <p className="text-lg font-semibold text-white">No quizzes yet</p>
            <p className="mt-2 text-slate-400">Generate a quiz from a document or create your own.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-400">
            Create a quiz
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => {
            const qCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
            return (
              <article key={quiz.id} className="group rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/10 transition hover:-translate-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-white">{quiz.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{qCount} {qCount === 1 ? 'question' : 'questions'}</p>
                  </div>
                </div>
                {quiz.summary && (
                  <p className="mt-3 text-sm text-slate-400 line-clamp-2">{quiz.summary}</p>
                )}
                <div className="mt-4 text-sm text-slate-500">{formatDate(quiz.created_at)}</div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveQuiz(quiz)}
                    className="flex items-center gap-2 rounded-3xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 transition hover:bg-violet-500/20"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Take Quiz
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    className="flex items-center gap-2 rounded-3xl border border-red-500/10 bg-red-500/5 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
