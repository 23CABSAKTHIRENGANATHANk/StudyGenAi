import { useCallback, useEffect, useState } from 'react';
import { FileText, Trash2, Upload, Sparkles, X, Loader2, BookOpen, ClipboardList, MessageSquare } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import { apiJson } from '../lib/api';

interface Document {
  id: string;
  name: string;
  subject: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string | null;
}

type AIMode = 'summary' | 'notes' | 'quiz' | 'flashcards';

const AI_MODES: { value: AIMode; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'summary', label: 'Summary', icon: FileText, desc: 'Concise bullet-point overview' },
  { value: 'notes', label: 'Study Notes', icon: BookOpen, desc: 'Detailed concept-organised notes' },
  { value: 'quiz', label: 'Quiz', icon: ClipboardList, desc: '5 multiple-choice questions' },
  { value: 'flashcards', label: 'Flashcards', icon: MessageSquare, desc: '10 Q&A flashcard pairs' },
];

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function mimeLabel(mime: string | null): string {
  if (!mime) return 'File';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('word') || mime.includes('docx')) return 'DOCX';
  if (mime.includes('presentation') || mime.includes('pptx')) return 'PPTX';
  return mime.split('/')[1]?.toUpperCase() ?? 'File';
}

// ── AI Generate Modal ─────────────────────────────────────────────────────────

interface AIModalProps {
  doc: Document;
  onClose: () => void;
}

function AIModal({ doc, onClose }: AIModalProps) {
  const [mode, setMode] = useState<AIMode>('summary');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await apiJson('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ document_id: doc.id, prompt: `Generate ${mode}`, mode }),
      });
      if (!res.ok) {
        setError((res.data as Record<string, unknown>)?.detail as string || 'Generation failed. Please try again.');
      } else {
        setResult((res.data as Record<string, unknown>)?.result as string || '');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl rounded-[32px] border border-white/10 bg-slate-900 p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">AI Generator</p>
            <h2 className="mt-1 text-xl font-semibold text-white truncate max-w-sm">{doc.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AI_MODES.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center text-sm transition ${
                mode === value
                  ? 'border-violet-400/50 bg-violet-500/10 text-white'
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
              <span className="text-xs text-slate-500">{desc}</span>
            </button>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate {AI_MODES.find(m => m.value === mode)?.label}
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [aiDoc, setAiDoc] = useState<Document | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiJson('/api/documents/list');
      if (!res.ok) {
        setError('Failed to load documents.');
      } else {
        setDocuments((res.data as { documents: Document[] })?.documents ?? []);
      }
    } catch {
      setError('Network error loading documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await apiJson(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      } else {
        alert('Delete failed. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {aiDoc && <AIModal doc={aiDoc} onClose={() => setAiDoc(null)} />}

      <div className="space-y-8">
        {/* Header */}
        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Document manager</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Your uploaded study materials</h1>
              <p className="mt-3 text-slate-300">
                Upload PDF, DOCX, or PPTX files and generate AI study content instantly.
              </p>
            </div>
            {!loading && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300 ring-1 ring-white/10">
                <FileText className="h-4 w-4 text-violet-400" />
                {documents.length} {documents.length === 1 ? 'document' : 'documents'}
              </div>
            )}
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
            <FileUpload onSuccess={loadDocuments} />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Document grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-[28px] bg-slate-900/80 animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center gap-6 rounded-[32px] border border-white/10 bg-slate-950/80 py-20 text-center">
            <Upload className="h-14 w-14 text-slate-700" />
            <div>
              <p className="text-lg font-semibold text-white">No documents yet</p>
              <p className="mt-2 text-slate-400">Upload your first study material above to get started.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => (
              <article
                key={doc.id}
                className="group rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/10 transition hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-white">{doc.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {doc.subject || 'No subject'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                    {mimeLabel(doc.mime_type)}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-sm text-slate-500">
                  <p>{formatBytes(doc.size_bytes)}</p>
                  <p>Uploaded {formatDate(doc.created_at)}</p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className="flex items-center gap-2 rounded-3xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 transition hover:bg-violet-500/20"
                    onClick={() => setAiDoc(doc)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.name)}
                    disabled={deletingId === doc.id}
                    className="flex items-center gap-2 rounded-3xl border border-red-500/10 bg-red-500/5 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/15 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === doc.id ? 'Deleting…' : 'Delete'}
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
