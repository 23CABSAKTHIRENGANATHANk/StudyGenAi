import { useCallback, useEffect, useState } from 'react';
import { FileText, Trash2, Upload, Sparkles } from 'lucide-react';
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

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiJson('/api/documents/list');
      if (!res.ok) {
        setError('Failed to load documents.');
      } else {
        setDocuments((res.json as { documents: Document[] }).documents ?? []);
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
                  className="flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                  onClick={() => alert('AI generation — coming soon!')}
                >
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
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
  );
}
