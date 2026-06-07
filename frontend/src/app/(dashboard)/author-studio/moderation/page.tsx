'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Clock,
  BookOpen,
  User,
  Loader2,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronDown,
  Flag,
  Send,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

interface QuestionSummary {
  id: string;
  content: string;
  type: string;
  grade: number;
  subjectId: string;
  status: string;
  difficulty: string;
  createdAt: string;
  createdBy: string;
  moderationNotes: string;
  topic?: { name: string };
  correctAnswer?: string;
  explanation?: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  bloomsTaxonomy?: string;
}

interface QualityScore {
  overall: number;
  grammar: number;
  clarity: number;
  difficulty_consistency: number;
  curriculum_alignment: number;
  feedback: string;
}

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const SUBJECTS = [
  'Mathematics', 'English', 'Kiswahili', 'Science and Technology',
  'Social Studies', 'Creative Arts', 'Home Science', 'Agriculture',
  'Pre-Technical Studies', 'Integrated Science',
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  pending_review: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700' },
  flagged: { label: 'Flagged', color: 'bg-red-100 text-red-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-gray-100 text-gray-600' },
};

export default function ModerationPage() {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QuestionSummary | null>(null);
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [scoring, setScoring] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (filterSubject) params.set('subjectId', filterSubject);
      if (filterGrade) params.set('grade', String(filterGrade));
      if (filterStatus) params.set('status', filterStatus);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await api.get(`/questions/moderation/queue?${params}`);
      setQuestions(res.data.questions);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterSubject, filterGrade, filterStatus, page]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleAction = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await api.put(`/questions/${id}/status`, { status, notes: notes || undefined });
      toast.success(`Question ${status.replace('_', ' ')}`);
      setSelected(null);
      setNotes('');
      setQualityScore(null);
      fetchQueue();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleScoreQuality = async (q: QuestionSummary) => {
    setScoring(true);
    try {
      const res = await api.post('/ai-assistant/quality-score', {
        question: {
          content: q.content,
          type: q.type,
          difficulty: q.difficulty,
          bloomsTaxonomy: q.bloomsTaxonomy,
          subject: q.subjectId,
          grade: q.grade,
          correctAnswer: q.correctAnswer,
          options: q.options,
          explanation: q.explanation,
        },
      });
      setQualityScore(res.data);
    } catch {
      toast.error('Quality scoring failed');
    } finally {
      setScoring(false);
    }
  };

  const selectQuestion = (q: QuestionSummary) => {
    setSelected(q);
    setQualityScore(null);
    setNotes('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
          <Link href="/author-studio" className="hover:text-blue-500">Author Studio</Link>
          <ChevronRight className="w-3 h-3" />
          <span>Moderation</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Content Moderation</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  placeholder="Search content or author..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <select
                  value={filterSubject}
                  onChange={(e) => { setFilterSubject(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Subjects</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                <select
                  value={filterGrade}
                  onChange={(e) => { setFilterGrade(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Grades</option>
                  {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {questions.length} of {total} questions
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Queue
                </h3>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : questions.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No questions in moderation queue
                  </div>
                ) : (
                  questions.map((q) => {
                    const badge = STATUS_BADGES[q.status] || { label: q.status, color: 'bg-gray-100 text-gray-600' };
                    return (
                      <button
                        key={q.id}
                        onClick={() => selectQuestion(q)}
                        className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                          selected?.id === q.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-gray-400">{q.type.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                          {q.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>Grade {q.grade}</span>
                          <span>·</span>
                          <span className="capitalize">{q.difficulty}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {total > 20 && (
                <div className="flex items-center justify-between p-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-500">{page} / {Math.ceil(total / 20)}</span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / 20)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selected ? (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question Preview</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Created by {selected.createdBy} · {new Date(selected.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGES[selected.status]?.color || ''}`}>
                        {STATUS_BADGES[selected.status]?.label || selected.status}
                      </span>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none mb-4">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selected.content}</p>
                  </div>

                  {selected.options && selected.options.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Options</p>
                      {selected.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            opt.isCorrect
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <span className="font-mono text-xs uppercase">{opt.id}.</span>
                          <span>{opt.text}</span>
                          {opt.isCorrect && <CheckCircle className="w-3.5 h-3.5 ml-auto text-green-500" />}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Type</span>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{selected.type.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Difficulty</span>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{selected.difficulty}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Grade</span>
                      <p className="font-medium text-gray-900 dark:text-white">Grade {selected.grade}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Bloom's Taxonomy</span>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{selected.bloomsTaxonomy || 'N/A'}</p>
                    </div>
                  </div>

                  {selected.explanation && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Explanation</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selected.explanation}</p>
                    </div>
                  )}

                  {selected.moderationNotes && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Previous Notes</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selected.moderationNotes}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        AI Quality Score
                      </h4>
                      <button
                        onClick={() => handleScoreQuality(selected)}
                        disabled={scoring}
                        className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                      >
                        {scoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {scoring ? 'Scoring...' : 'Score'}
                      </button>
                    </div>

                    {qualityScore ? (
                      <div className="space-y-2">
                        {[
                          { label: 'Overall', value: qualityScore.overall },
                          { label: 'Grammar', value: qualityScore.grammar },
                          { label: 'Clarity', value: qualityScore.clarity },
                          { label: 'Difficulty Consistency', value: qualityScore.difficulty_consistency },
                          { label: 'Curriculum Alignment', value: qualityScore.curriculum_alignment },
                        ].map((item) => {
                          const color = item.value >= 80 ? 'bg-green-500' : item.value >= 60 ? 'bg-amber-500' : 'bg-red-500';
                          return (
                            <div key={item.label} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-32 shrink-0">{item.label}</span>
                              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${item.value}%` }} />
                              </div>
                              <span className="text-xs font-mono w-8 text-right text-gray-600 dark:text-gray-400">{item.value}</span>
                            </div>
                          );
                        })}
                        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          {qualityScore.feedback}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        <Sparkles className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <p className="text-xs">Click "Score" for AI quality assessment</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 mb-3">
                      <MessageSquare className="w-4 h-4" />
                      Moderation Notes
                    </h4>

                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add moderation notes (optional)..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3"
                      rows={3}
                    />

                    <div className="space-y-2">
                      <button
                        onClick={() => handleAction(selected.id, 'approved')}
                        disabled={actionLoading !== null}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {actionLoading === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAction(selected.id, 'flagged')}
                          disabled={actionLoading !== null}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          Flag
                        </button>
                        <button
                          onClick={() => handleAction(selected.id, 'draft')}
                          disabled={actionLoading !== null}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Send to Draft
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Select a Question</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose a question from the queue to review, score, and moderate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
