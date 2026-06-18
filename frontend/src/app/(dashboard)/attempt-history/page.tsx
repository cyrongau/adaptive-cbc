'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  Loader2,
  BarChart2,
  Award,
  Target,
  TrendingUp,
  Clock,
  BookOpen,
} from 'lucide-react';
import HtmlContent from '@/components/ui/HtmlContent';

interface AttemptSummary {
  question: {
    id: string;
    content: string;
    type: string;
    subjectId: string;
    grade: number;
    mediaUrl?: string;
    questionMedia?: { type: string; url: string; alt?: string }[];
    correctAnswer?: string;
    explanation?: string;
  };
  attempts: {
    id: string;
    answer: string;
    isCorrect: boolean;
    attemptNumber: number;
    xpAwarded: number;
    sessionType: string;
    attemptedAt: string;
  }[];
  firstAttemptCorrect: boolean;
  totalAttempts: number;
  totalXp: number;
}

export default function AttemptHistoryPage() {
  const [data, setData] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/questions/attempts/my-performance');
      setData(res.data || []);
    } catch {
      toast.error('Failed to load attempt history');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const totalCorrectFirstAttempt = data.filter((q) => q.firstAttemptCorrect).length;
  const totalXp = data.reduce((sum, q) => sum + q.totalXp, 0);
  const totalAttempts = data.reduce((sum, q) => sum + q.totalAttempts, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">My Attempt History</h1>
        <p className="text-slate-500 mt-1">Track your performance across all attempted questions.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Questions</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{data.length}</p>
          <p className="text-xs text-slate-500">Total attempted</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">First Try</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {data.length > 0 ? Math.round((totalCorrectFirstAttempt / data.length) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-500">{totalCorrectFirstAttempt} of {data.length} correct</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Target className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Attempts</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalAttempts}</p>
          <p className="text-xs text-slate-500">Total submissions</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Award className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">XP Earned</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalXp}</p>
          <p className="text-xs text-slate-500">Total points</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
          Loading your performance data...
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No attempts yet</h3>
          <p className="text-slate-500">Start practicing or answering questions to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item) => {
            const isExpanded = expanded[item.question.id];
            return (
              <motion.div
                key={item.question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpanded((prev) => ({ ...prev, [item.question.id]: !isExpanded }))}
                  className="w-full text-left p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <HtmlContent html={item.question.content} className="text-sm font-semibold text-slate-900 line-clamp-2" renderMath={true} />
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                          Grade {item.question.grade}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full capitalize">
                          {item.question.type?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                          {item.totalAttempts} attempt{item.totalAttempts > 1 ? 's' : ''}
                        </span>
                        {item.firstAttemptCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Correct on first try
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Not correct on first try
                          </span>
                        )}
                        {item.totalXp > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
                            <Award className="w-3 h-3" />
                            +{item.totalXp} XP
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-slate-400 shrink-0">
                      <BarChart2 className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                    {item.question.questionMedia?.map((media, i) => (
                      <div key={i} className="flex justify-center">
                        <img src={media.url} alt={media.alt || 'Question diagram'} className="max-w-full h-auto rounded-lg border border-slate-200" style={{ maxHeight: '250px' }} />
                      </div>
                    ))}
                    {!item.question.questionMedia?.length && item.question.mediaUrl && (
                      <div className="flex justify-center">
                        <img src={item.question.mediaUrl} alt="Question diagram" className="max-w-full h-auto rounded-lg border border-slate-200" style={{ maxHeight: '250px' }} />
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attempt History</p>
                      {item.attempts.map((attempt) => (
                        <div key={attempt.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                Attempt #{attempt.attemptNumber}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(attempt.attemptedAt).toLocaleDateString()}
                              </span>
                              {attempt.isCorrect ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
                                  <CheckCircle className="w-3 h-3" /> Correct
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">
                                  <XCircle className="w-3 h-3" /> Incorrect
                                </span>
                              )}
                              {attempt.xpAwarded > 0 && (
                                <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
                                  +{attempt.xpAwarded} XP
                                </span>
                              )}
                            </div>
                          </div>
                          {attempt.answer?.startsWith('data:image/') || attempt.answer?.startsWith('data:image/svg+xml') ? (
                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-w-sm mt-2">
                              <img src={attempt.answer} alt="Your drawing" className="w-full h-auto" />
                            </div>
                          ) : attempt.answer ? (
                            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100 mt-2">
                              {attempt.answer}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {item.question.explanation && (
                      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Explanation</p>
                        <HtmlContent html={item.question.explanation} className="text-sm text-indigo-800" renderMath={true} />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
