import React, { useState, useEffect, useRef } from 'react';
import { apiJson } from '../lib/api';
import { DocumentItem } from '../types';
import { Send, Bot, User, FileText, Sparkles, Loader2 } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await apiJson('/api/documents/list');
        if (res.ok && res.data) {
          const docs = (res.data as { documents: DocumentItem[] }).documents || [];
          setDocuments(docs);
          if (docs.length > 0) {
            setSelectedDocId(docs[0].id);
          }
        } else {
          setError('Failed to fetch documents.');
        }
      } catch {
        setError('Network error loading documents.');
      } finally {
        setLoadingDocs(false);
      }
    }
    loadDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendingMessage]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || !selectedDocId || sendingMessage) return;

    const userQuery = inputText;
    setInputText('');
    
    // Add user message to UI
    const newMsg: ChatMessage = {
      sender: 'user',
      text: userQuery,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMsg]);
    setSendingMessage(true);

    try {
      const res = await apiJson<{ reply: string }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          document_id: selectedDocId,
          prompt: userQuery,
          mode: 'chat'
        })
      });

      if (res.ok && res.data) {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: res.data?.reply || 'No response generated.',
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: `Error: ${res.data || 'Failed to generate response.'}`,
          timestamp: new Date()
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Network error. Please check your connection and try again.',
        timestamp: new Date()
      }]);
    } finally {
      setSendingMessage(false);
    }
  }

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] md:h-[calc(100vh-140px)] gap-4 md:gap-6">
      {/* Document Sidebar Selector (Desktop Only) */}
      <div className="hidden md:flex w-80 rounded-[28px] border border-white/10 bg-slate-950/70 p-6 flex-col backdrop-blur-md">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-violet-400" />
          Active Source
        </h2>
        <p className="mt-1 text-xs text-slate-400">Select a document to ask questions about.</p>

        {loadingDocs ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        ) : error ? (
          <p className="mt-6 text-sm text-red-400">{error}</p>
        ) : documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5">
            <FileText className="h-8 w-8 text-slate-500 mb-2" />
            <p className="text-sm text-slate-400 font-medium">No documents yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload a PDF or TXT file under Documents first.</p>
          </div>
        ) : (
          <div className="mt-6 flex-1 overflow-y-auto space-y-2 pr-1">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  setSelectedDocId(doc.id);
                  setMessages([]);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition duration-200 ${
                  selectedDocId === doc.id
                    ? 'border-violet-500 bg-violet-500/10 text-white'
                    : 'border-white/5 bg-slate-900/40 text-slate-300 hover:border-white/10 hover:bg-slate-900/60'
                }`}
              >
                <div className="font-medium text-sm truncate">{doc.name}</div>
                <div className="text-xs text-slate-500 mt-1 truncate">{doc.subject || 'General Study'}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 rounded-[28px] border border-white/10 bg-slate-950/70 flex flex-col backdrop-blur-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 sm:px-8 sm:py-5 border-b border-white/10 flex items-center justify-between bg-slate-900/20 gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              Chat with Source
              {selectedDoc && (
                <span className="text-[10px] sm:text-xs bg-violet-500/20 text-violet-300 px-2.5 py-0.5 rounded-full font-normal shrink-0">
                  Active
                </span>
              )}
            </h1>
            <p className="hidden sm:block text-xs text-slate-400 mt-0.5 truncate max-w-lg">
              {selectedDoc ? `Reading: ${selectedDoc.name}` : 'No active document selected.'}
            </p>
          </div>

          {/* Mobile Source Selector Dropdown */}
          <div className="md:hidden shrink-0 max-w-[140px] sm:max-w-[200px]">
            <select
              value={selectedDocId}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                setMessages([]);
              }}
              aria-label="Select source document"
              className="w-full truncate rounded-xl border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-400"
            >
              {documents.length === 0 ? (
                <option value="">No documents</option>
              ) : (
                documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <Sparkles className="hidden sm:block h-5 w-5 text-violet-400 animate-pulse shrink-0" />
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <Bot className="h-12 w-12 text-violet-400 mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Ask your document anything</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm">
                Get instant explanations, definitions, summaries, or conceptual breakdowns directly from your source material.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 sm:gap-4 max-w-3xl ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border ${
                    msg.sender === 'user'
                      ? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                      : 'border-white/10 bg-slate-900 text-slate-300'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="h-4 w-4 sm:h-5 sm:w-5" /> : <Bot className="h-4 w-4 sm:h-5 sm:w-5" />}
                </div>

                <div
                  className={`rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm leading-relaxed border ${
                    msg.sender === 'user'
                      ? 'bg-violet-600 border-violet-500 text-white rounded-tr-none'
                      : 'bg-slate-900/60 border-white/5 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))
          )}

          {sendingMessage && (
            <div className="flex gap-3 sm:gap-4 max-w-3xl">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900 text-slate-300">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm bg-slate-900/60 border border-white/5 text-slate-400 rounded-tl-none flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                <span>AI is reading and thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-900/20">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!selectedDocId || sendingMessage}
              placeholder={
                selectedDocId
                  ? "Ask a question..."
                  : "Upload/select a document to start"
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 sm:px-5 sm:py-4 pr-12 sm:pr-14 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !selectedDocId || sendingMessage}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 text-white transition disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
