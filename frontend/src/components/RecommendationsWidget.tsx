'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Target, BookOpen, X, Loader2, TrendingUp, CheckCircle, Plus } from 'lucide-react';

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  subjectId?: string;
  topicId?: string;
  priority: number;
  createdAt: string;
}

interface StudyGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: string;
  createdAt: string;
}

export default function RecommendationsWidget() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(80);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recsRes, goalsRes, weakRes] = await Promise.all([
        api.get('/recommendations').catch(() => ({ data: [] })),
        api.get('/recommendations/goals').catch(() => ({ data: [] })),
        api.get('/recommendations/weak-areas').catch(() => ({ data: [] })),
      ]);
      setRecommendations(recsRes.data || []);
      setGoals(goalsRes.data || []);
      setWeakAreas(weakRes.data || []);

      if ((recsRes.data || []).length === 0) {
        api.post('/recommendations/generate').then((r) => setRecommendations(r.data || [])).catch(() => {});
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const dismissRec = async (id: string) => {
    await api.post(`/recommendations/${id}/dismiss`);
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  const createGoal = async () => {
    if (!goalTitle.trim()) return;
    const res = await api.post('/recommendations/goals', { title: goalTitle.trim(), targetScore: goalTarget });
    setGoals((prev) => [res.data, ...prev]);
    setShowGoalForm(false);
    setGoalTitle('');
  };

  const completeGoal = async (id: string) => {
    await api.post(`/recommendations/goals/${id}/complete`);
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, status: 'completed', progress: 100 } : g));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <div className="space-y-4">
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900">AI Recommendations</h3>
          </div>
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((rec) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-xl p-4 border ${
                  rec.type === 'practice'
                    ? 'bg-indigo-50 border-indigo-100'
                    : rec.type === 'goal'
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {rec.type === 'practice' ? (
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                      ) : rec.type === 'goal' ? (
                        <Target className="w-4 h-4 text-amber-500" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-slate-500" />
                      )}
                      <p className="font-semibold text-sm text-slate-900">{rec.title}</p>
                    </div>
                    <p className="text-xs text-slate-600 ml-6">{rec.description}</p>
                    {rec.type === 'practice' && (
                      <Link
                        href={`/practice?subjectId=${rec.subjectId || ''}`}
                        className="ml-6 mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Start Practice <TrendingUp className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  <button
                    onClick={() => dismissRec(rec.id)}
                    className="p-1 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-200 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Study Goals */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900">Study Goals</h3>
          </div>
          <button
            onClick={() => setShowGoalForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-medium hover:bg-emerald-600"
          >
            <Plus className="w-3.5 h-3.5" /> New Goal
          </button>
        </div>

        {showGoalForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
          >
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g. Master Algebra basics"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-500">Target: {goalTarget}%</label>
              <input
                type="range"
                min={50}
                max={100}
                value={goalTarget}
                onChange={(e) => setGoalTarget(Number(e.target.value))}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={createGoal} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600">
                Create Goal
              </button>
              <button onClick={() => setShowGoalForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {activeGoals.length === 0 && completedGoals.length === 0 && (
          <p className="text-sm text-slate-400">No study goals yet. Set your first goal to track improvement!</p>
        )}

        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <div key={goal.id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm text-slate-900">{goal.title}</p>
                  {goal.description && <p className="text-xs text-slate-500">{goal.description}</p>}
                </div>
                <button onClick={() => completeGoal(goal.id)} className="p-1 text-emerald-400 hover:text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">{goal.progress}%</span>
              </div>
            </div>
          ))}
          {completedGoals.slice(0, 2).map((goal) => (
            <div key={goal.id} className="border border-emerald-200 bg-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-800 line-through">{goal.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-slate-900">Areas for Improvement</h3>
          </div>
          <div className="space-y-2">
            {weakAreas.map((area, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{area.label}</p>
                </div>
                <span className="text-xs font-bold text-red-600">{Math.round((area.score / area.total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
