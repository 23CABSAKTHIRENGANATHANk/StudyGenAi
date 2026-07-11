-- Row Level Security policies for StudyGen AI
-- Enable RLS on key tables and allow authenticated users to access their own rows

-- Enable RLS
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Documents: owner can insert/select/update/delete
CREATE POLICY "documents_owner_policy" ON documents
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "document_chunks_owner_policy" ON document_chunks
  USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid()));

CREATE POLICY "embeddings_owner_policy" ON embeddings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notes/Flashcards/Quizzes/Results/Study plans/Notifications
CREATE POLICY "user_rows_owner" ON notes
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_rows_owner_flashcards" ON flashcards
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_rows_owner_quizzes" ON quizzes
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_rows_owner_quiz_results" ON quiz_results
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_rows_owner_study_plans" ON study_plans
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_rows_owner_notifications" ON notifications
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to insert into users/profiles through service role or controlled flows
