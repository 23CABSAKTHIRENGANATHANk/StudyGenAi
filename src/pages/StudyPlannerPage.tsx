import React, { useState, useEffect, useCallback } from 'react';
import { apiJson } from '../lib/api';
import { StudyPlanItem } from '../types';
import { 
  Plus, Trash2, Calendar, CheckSquare, Square, 
  Check, Loader2, CheckCircle2, Clock, BookOpen, X, AlertCircle
} from 'lucide-react';

interface NewPlanModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function NewPlanModal({ onClose, onCreated }: NewPlanModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [tasksText, setTasksText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError('');

    // Parse tasks list (one per line)
    const items = tasksText
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(taskName => ({ task: taskName, completed: false }));

    try {
      const res = await apiJson('/api/study-plans', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || null,
          target_date: targetDate || null,
          plan_items: items
        })
      });

      if (res.ok) {
        onCreated();
        onClose();
      } else {
        setError('Failed to create study plan.');
      }
    } catch {
      setError('Network error creating study plan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-[32px] border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Create New Study Plan</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology Midterm prep"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Read chapters 1-4 and complete mock exams."
              rows={2}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Milestones / Tasks (one per line)</label>
            <textarea
              value={tasksText}
              onChange={(e) => setTasksText(e.target.value)}
              placeholder="Read Chapter 1&#10;Write Summary&#10;Solve Chemistry equations"
              rows={4}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none resize-none"
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-3xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-3xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-400 transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudyPlannerPage() {
  const [plans, setPlans] = useState<StudyPlanItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiJson('/api/study-plans');
      if (res.ok && res.data) {
        const studyPlans = (res.data as { study_plans: StudyPlanItem[] }).study_plans || [];
        setPlans(studyPlans);
        if (studyPlans.length > 0 && !selectedPlanId) {
          setSelectedPlanId(studyPlans[0].id);
        }
      } else {
        setError('Failed to fetch study plans.');
      }
    } catch {
      setError('Network error loading study plans.');
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    loadPlans();
  }, []);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Helper: calculate tasks statistics
  const getPlanStats = (plan: StudyPlanItem) => {
    const items = Array.isArray(plan.plan_items) ? (plan.plan_items as Array<{task: string, completed: boolean}>) : [];
    const total = items.length;
    const completed = items.filter(i => i.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage, items };
  };

  async function handleToggleItem(taskIndex: number) {
    if (!selectedPlan) return;
    const { items } = getPlanStats(selectedPlan);
    
    // Toggle completed state
    const updatedItems = items.map((item, idx) => 
      idx === taskIndex ? { ...item, completed: !item.completed } : item
    );

    // If all items are completed, mark the plan as completed
    const allCompleted = updatedItems.length > 0 && updatedItems.every(i => i.completed);

    try {
      // Optimistic update
      setPlans(prev => prev.map(p => 
        p.id === selectedPlan.id 
          ? { ...p, plan_items: updatedItems, completed: allCompleted } 
          : p
      ));

      await apiJson(`/api/study-plans/${selectedPlan.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          plan_items: updatedItems,
          completed: allCompleted
        })
      });
    } catch {
      // Revert if error
      loadPlans();
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan || !newTaskInput.trim()) return;

    const { items } = getPlanStats(selectedPlan);
    const updatedItems = [...items, { task: newTaskInput.trim(), completed: false }];
    setNewTaskInput('');

    try {
      setPlans(prev => prev.map(p => 
        p.id === selectedPlan.id ? { ...p, plan_items: updatedItems, completed: false } : p
      ));

      await apiJson(`/api/study-plans/${selectedPlan.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          plan_items: updatedItems,
          completed: false
        })
      });
    } catch {
      loadPlans();
    }
  }

  async function handleDeletePlan(planId: string) {
    if (!window.confirm('Are you sure you want to delete this study plan?')) return;
    
    try {
      setPlans(prev => prev.filter(p => p.id !== planId));
      if (selectedPlanId === planId) {
        setSelectedPlanId('');
      }

      await apiJson(`/api/study-plans/${planId}`, {
        method: 'DELETE'
      });
    } catch {
      loadPlans();
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* Plans List Sidebar */}
      <div className="w-80 rounded-[28px] border border-white/10 bg-slate-950/70 p-6 flex flex-col backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-400" />
            Study Plans
          </h2>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-violet-600 p-2 text-white hover:bg-violet-500 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {loading && plans.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        ) : error ? (
          <p className="mt-6 text-sm text-red-400">{error}</p>
        ) : plans.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5">
            <Calendar className="h-8 w-8 text-slate-500 mb-2" />
            <p className="text-sm text-slate-400 font-medium">No plans yet</p>
            <p className="text-xs text-slate-500 mt-1">Create your first study schedule to get started!</p>
          </div>
        ) : (
          <div className="mt-6 flex-1 overflow-y-auto space-y-2 pr-1">
            {plans.map((plan) => {
              const { percentage, completed, total } = getPlanStats(plan);
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition duration-200 ${
                    selectedPlanId === plan.id
                      ? 'border-violet-500 bg-violet-500/10 text-white'
                      : 'border-white/5 bg-slate-900/40 text-slate-300 hover:border-white/10 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="font-medium text-sm truncate">{plan.title}</div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {completed}/{total} tasks
                    </span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="mt-2 w-full bg-slate-800 rounded-full h-1">
                    <div 
                      className="bg-violet-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Plan Details Area */}
      <div className="flex-1 rounded-[28px] border border-white/10 bg-slate-950/70 flex flex-col backdrop-blur-md overflow-hidden">
        {selectedPlan ? (
          <>
            {/* Header */}
            <div className="px-8 py-5 border-b border-white/10 flex items-start justify-between bg-slate-900/20">
              <div className="space-y-1">
                <h1 className="text-xl font-semibold text-white flex items-center gap-3">
                  {selectedPlan.title}
                  {selectedPlan.completed ? (
                    <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full">
                      <Check className="h-3 w-3" /> Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full">
                      <Clock className="h-3 w-3" /> In Progress
                    </span>
                  )}
                </h1>
                {selectedPlan.description && (
                  <p className="text-sm text-slate-400 max-w-xl">{selectedPlan.description}</p>
                )}
                {selectedPlan.target_date && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Target: {new Date(selectedPlan.target_date).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDeletePlan(selectedPlan.id)}
                className="rounded-xl border border-red-500/20 p-2.5 text-red-400 transition hover:bg-red-500/10"
                title="Delete Plan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Checklist items */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Milestones & Tasks</h3>
              {getPlanStats(selectedPlan).items.length === 0 ? (
                <div className="text-center p-8 rounded-2xl border border-white/5 bg-slate-900/10 text-slate-500">
                  No tasks defined in this plan yet. Use the input below to add one!
                </div>
              ) : (
                <div className="space-y-2">
                  {getPlanStats(selectedPlan).items.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleItem(idx)}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition duration-200 ${
                        item.completed
                          ? 'border-white/5 bg-slate-900/25 text-slate-500 line-through'
                          : 'border-white/10 bg-slate-900/40 text-slate-200 hover:border-white/20'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {item.completed ? (
                          <CheckSquare className="h-5 w-5 text-violet-400" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                      <span className="text-sm">{item.task}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add task bar */}
            <div className="p-6 border-t border-white/10 bg-slate-900/20">
              <form onSubmit={handleAddTask} className="flex gap-3">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="Add a new milestone or action item to this study plan..."
                  className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newTaskInput.trim()}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 px-6 py-4 text-sm font-semibold text-white transition disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Calendar className="h-12 w-12 text-violet-400 mb-4" />
            <h3 className="text-lg font-semibold text-white">No plan selected</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm">
              Select an existing study plan from the sidebar, or click the plus icon to create a new customized learning schedule.
            </p>
          </div>
        )}
      </div>

      {showCreate && (
        <NewPlanModal
          onClose={() => setShowCreate(false)}
          onCreated={loadPlans}
        />
      )}
    </div>
  );
}
