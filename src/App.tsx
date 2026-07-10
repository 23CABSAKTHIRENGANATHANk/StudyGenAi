import { Route, Routes, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'));
const QuizzesPage = lazy(() => import('./pages/QuizzesPage'));
const StudyPlannerPage = lazy(() => import('./pages/StudyPlannerPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Suspense fallback={<div className="p-8">Loading...</div>}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/*" element={<AuthPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="flashcards" element={<FlashcardsPage />} />
              <Route path="quizzes" element={<QuizzesPage />} />
              <Route path="study-planner" element={<StudyPlannerPage />} />
              <Route path="chat" element={<ChatPage />} />
            </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
