import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Sparkles, BookOpen, ClipboardList } from 'lucide-react';
import Card from '../components/Card';
import { apiJson } from '../lib/api';

interface UsageStats {
  documents_uploaded: number;
  notes_generated: number;
  flashcards_created: number;
  quizzes_taken: number;
}

interface RecentDocument {
  id: string;
  name: string;
  subject: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string | null;
}

interface DashboardData {
  welcome: string;
  recent_documents: RecentDocument[];
  usage: UsageStats;
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiJson('/api/dashboard/overview');
        if (!res.ok) {
          setError('Failed to load dashboard data.');
        } else {
          setData(res.json as DashboardData);
        }
      } catch {
        setError('Network error loading dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const usage = data?.usage;
  const usageItems = [
    { label: 'Documents', value: usage?.documents_uploaded ?? 0, icon: Upload },
    { label: 'Notes', value: usage?.notes_generated ?? 0, icon: BookOpen },
    { label: 'Flashcards', value: usage?.flashcards_created ?? 0, icon: Sparkles },
    { label: 'Quizzes', value: usage?.quizzes_taken ?? 0, icon: ClipboardList },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Welcome back</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Your study dashboard</h1>
            <p className="mt-3 text-slate-300">
              Review your recent documents, AI usage, and planning insights in one place.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full bg-white/5 px-5 py-3 text-sm text-slate-200 ring-1 ring-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Online and ready
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          {/* Quick Actions + Usage */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card title="Quick Actions" accent>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Upload document', to: '/app/documents' },
                  { label: 'Generate summary', to: '/app/documents' },
                  { label: 'Create quiz', to: '/app/documents' },
                  { label: 'Chat with notes', to: '/app/documents' },
                ].map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    className="rounded-3xl bg-white/5 px-4 py-4 text-left text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </Card>

            <Card title="Usage Overview">
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="h-20 rounded-3xl bg-slate-900/80 animate-pulse" />
                  ))}
                </div>
              ) : (
                <dl className="grid gap-4 sm:grid-cols-2">
                  {usageItems.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-3xl bg-slate-900/80 p-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-violet-400" />
                        <p className="text-sm text-slate-400">{label}</p>
                      </div>
                      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </dl>
              )}
            </Card>
          </div>

          {/* Recent Documents */}
          <Card title="Recent Documents">
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-16 rounded-3xl bg-slate-900/80 animate-pulse" />
                ))}
              </div>
            ) : !data?.recent_documents?.length ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <Upload className="h-10 w-10 text-slate-600" />
                <p className="text-slate-400">No documents yet.</p>
                <Link
                  to="/app/documents"
                  className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
                >
                  Upload your first document
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recent_documents.map((doc) => (
                  <div key={doc.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">{doc.name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {doc.subject || 'No subject'} · {formatBytes(doc.size_bytes)} · {formatDate(doc.created_at)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                        {mimeLabel(doc.mime_type)}
                      </span>
                    </div>
                  </div>
                ))}
                {(data.usage?.documents_uploaded ?? 0) > 5 && (
                  <Link to="/app/documents" className="block text-center text-sm text-violet-400 hover:text-violet-300">
                    View all {data.usage.documents_uploaded} documents →
                  </Link>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card title="Study Progress">
            <div className="space-y-5">
              {[
                { label: 'Documents this week', value: '—' },
                { label: 'Goal completion', value: '—' },
                { label: 'Tasks completed', value: '—' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{item.label}</span>
                    <span className="text-white">{item.value}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-full w-0 rounded-full bg-violet-400" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Study Planner">
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="font-semibold text-white">Upload study materials</p>
                <p className="mt-1 text-slate-400">Get started by uploading your first document</p>
              </li>
              <li className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="font-semibold text-white">Generate flashcards</p>
                <p className="mt-1 text-slate-400">AI-generated from your uploaded notes</p>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
