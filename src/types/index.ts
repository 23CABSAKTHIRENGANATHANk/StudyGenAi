export interface User {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthContextType {
  session: User | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export interface DocumentItem {
  id: string;
  name: string;
  subject: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string | null;
}

export interface NoteItem {
  id: string;
  document_id: string | null;
  title: string;
  content: string;
  type: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface FlashcardItem {
  id: string;
  document_id: string | null;
  question: string;
  answer: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface QuizItem {
  id: string;
  document_id: string | null;
  title: string;
  questions: unknown;
  summary: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface StudyPlanItem {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completed: boolean;
  plan_items: unknown;
  created_at: string | null;
  updated_at: string | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  scheduled_at: string | null;
  created_at: string | null;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
}
