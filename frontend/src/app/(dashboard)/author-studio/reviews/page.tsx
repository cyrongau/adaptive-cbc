'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  User,
  Clock,
  History,
  Eye,
} from 'lucide-react';
import HtmlContent from '@/components/ui/HtmlContent';

interface ReviewAttempt {
  id: string;
  userId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  sessionType: string;
  attemptedAt: string;
  reviewedAt?: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    grade: number;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
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
}

type Tab = 'pending' | 'reviewed';

export default function ReviewsPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [pendingAttempts, setPendingAttempts] = useState<ReviewAttempt[]>([]);
  const [reviewedAttempts, setReviewedAttempts] = useState<ReviewAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<Record<string, boolean>>({});

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/questions/attempts/pending-review');
      setPendingAttempts(res.data || []);
    } catch {
      toast.error('Failed to load pending reviews');
      setPendingAttempts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReviewed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/questions/attempts/reviewed-history');
      setReviewedAttempts(res.data || []);
    } catch {
      toast.error('Failed to load review history');
      setReviewedAttempts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'pending') fetchPending();
    else fetchReviewed();
  }, [tab, fetchPending, fetchReviewed]);

  const handleEvaluate = async (attemptId: string, isCorrect: boolean) => {
    setEvaluating((prev) => ({ ...prev, [attemptId]: true }));
    try {
      await api.put(`/questions/attempts/${attemptId}/evaluate`, { isCorrect });
      toast.success(isCorrect ? 'Marked as correct' : 'Marked as incorrect');
      setPendingAttempts((prev) => prev.filter((a) => a.id !== attemptId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to evaluate');
    } finally {
      setEvaluating((prev) => ({ ...prev, [attemptId]: false }));
    }
  };

  const pendingCount = pendingAttempts.length;
  const reviewedCount = reviewedAttempts.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Answer Reviews</h1>
          <p className="text-slate-500 mt-1">
            {tab === 'pending'
              ? pendingCount > 0 ? `${pendingCount} drawing canvas answer${pendingCount > 1 ? 's' : ''} awaiting your evaluation` : 'No pending reviews'
              : `${reviewedCount} previously reviewed answer${reviewedCount > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={tab === 'pending' ? fetchPending : fetchReviewed}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit shadow-sm">
        <button
          onClick={() => setTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock className="w-4 h-4" />
          Pending
          {pendingCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-bold">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab('reviewed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'reviewed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <History className="w-4 h-4" />
          Reviewed
          {reviewedCount > 0 && (
            <span className="bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full font-bold">{reviewedCount}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
          Loading...
        </div>
      ) : tab === 'pending' ? (
        pendingAttempts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-1">All caught up!</h3>
            <p className="text-slate-500">No drawing canvas answers are waiting for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAttempts.map((attempt) => (
              <AttemptCard key={attempt.id} attempt={attempt} evaluating={evaluating[attempt.id]} onEvaluate={handleEvaluate} isReviewed={false} />
            ))}
          </div>
        )
      ) : reviewedAttempts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No review history</h3>
          <p className="text-slate-500">Reviewed answers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewedAttempts.map((attempt) => (
            <AttemptCard key={attempt.id} attempt={attempt} evaluating={false} onEvaluate={undefined} isReviewed={true} />
          ))}
        </div>
      )}
    </div>
  );
}

function AttemptCard({
  attempt,
  evaluating,
  onEvaluate,
  isReviewed,
}: {
  attempt: ReviewAttempt;
  evaluating: boolean;
  onEvaluate?: (id: string, correct: boolean) => void;
  isReviewed: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                <User className="w-3 h-3" />
                {attempt.student.firstName} {attempt.student.lastName}
              </span>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                Grade {attempt.student.grade || attempt.question.grade}
              </span>
              <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full capitalize flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(attempt.attemptedAt).toLocaleDateString()}
              </span>
              <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full capitalize">
                {attempt.sessionType || 'question_bank'}
              </span>
              {isReviewed && (
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${attempt.isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {attempt.isCorrect ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {attempt.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              )}
              {isReviewed && attempt.reviewer && (
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  by {attempt.reviewer.firstName}
                </span>
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Question</p>
              <HtmlContent html={attempt.question.content} className="text-sm font-semibold text-slate-900" renderMath={true} />
              {attempt.question.questionMedia?.map((media, i) => (
                <div key={i} className="mt-2 flex justify-center">
                  <img src={media.url} alt={media.alt || 'Question diagram'} className="max-w-full h-auto rounded-lg border border-slate-200" style={{ maxHeight: '200px' }} />
                </div>
              ))}
              {!attempt.question.questionMedia?.length && attempt.question.mediaUrl && (
                <div className="mt-2 flex justify-center">
                  <img src={attempt.question.mediaUrl} alt="Question diagram" className="max-w-full h-auto rounded-lg border border-slate-200" style={{ maxHeight: '200px' }} />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Student Answer</p>
              {attempt.answer?.startsWith('data:image/') || attempt.answer?.startsWith('data:image/svg+xml') ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-w-md">
                  <img src={attempt.answer} alt="Student drawing" className="w-full h-auto" />
                </div>
              ) : (
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">
                  {attempt.answer || '(no answer)'}
                </p>
              )}
            </div>

            {attempt.question.explanation && (
              <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Explanation</p>
                <HtmlContent html={attempt.question.explanation} className="text-sm text-indigo-800" renderMath={true} />
              </div>
            )}
          </div>
        </div>

        {!isReviewed && onEvaluate && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => onEvaluate(attempt.id, true)}
              disabled={evaluating}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark Correct
            </button>
            <button
              onClick={() => onEvaluate(attempt.id, false)}
              disabled={evaluating}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Mark Incorrect
            </button>
          </div>
        )}

        {isReviewed && attempt.reviewedAt && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Reviewed on {new Date(attempt.reviewedAt).toLocaleDateString()} {new Date(attempt.reviewedAt).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
