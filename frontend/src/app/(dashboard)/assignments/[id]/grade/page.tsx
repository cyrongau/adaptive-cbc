'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import HtmlContent from '@/components/ui/HtmlContent';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, User, CheckCircle, FileText, Loader2, Star, Send, MessageSquare, ChevronDown, ChevronRight, X, Brain, AlertCircle, TrendingUp, Award } from 'lucide-react';

export default function GradeAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [manualScore, setManualScore] = useState('');
  const [gradingLoading, setGradingLoading] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<Record<string, boolean>>({});
  const [submissionDetail, setSubmissionDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        api.get(`/assignments/${id}`),
        api.get(`/assignments/${id}/submissions`),
      ]);
      setAssignment(assignmentRes.data);
      setSubmissions(submissionsRes.data || []);
    } catch {
      toast.error('Failed to load data');
      router.push('/assignments');
    } finally { setLoading(false); }
  };

  const handleAutoGrade = async (submissionId: string) => {
    setGradingLoading(true);
    try {
      await api.post(`/assignments/${id}/submissions/${submissionId}/auto-grade`);
      toast.success('Auto-graded successfully!');
      setSubmissionDetail(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Auto-grade failed');
    } finally { setGradingLoading(false); }
  };

  const handleManualGrade = async (submissionId: string) => {
    const score = parseInt(manualScore);
    if (isNaN(score) || score < 0 || (assignment && score > assignment.totalPoints)) {
      toast.error(`Score must be between 0 and ${assignment?.totalPoints}`); return;
    }
    setGradingLoading(true);
    try {
      await api.post(`/assignments/${id}/submissions/${submissionId}/grade`, { score });
      toast.success('Graded successfully!');
      setSelectedSubmission(null);
      setManualScore('');
      setSubmissionDetail(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Grading failed');
    } finally { setGradingLoading(false); }
  };

  const viewDetails = async (submissionId: string) => {
    setDetailLoading(true);
    setSubmissionDetail(null);
    try {
      const res = await api.get(`/assignments/${id}/submissions/${submissionId}/detail`);
      setSubmissionDetail(res.data);
    } catch {
      toast.error('Failed to load submission details');
    } finally { setDetailLoading(false); }
  };

  const toggleExpand = async (submissionId: string) => {
    if (expandedSubmission === submissionId) { setExpandedSubmission(null); return; }
    setExpandedSubmission(submissionId);
    try {
      const res = await api.get(`/assignments/${id}/submissions/${submissionId}/comments`);
      setComments((prev) => ({ ...prev, [submissionId]: res.data }));
    } catch {}
  };

  const handleSendComment = async (submissionId: string) => {
    const content = newComment[submissionId]?.trim();
    if (!content) return;
    setSendingComment((prev) => ({ ...prev, [submissionId]: true }));
    try {
      await api.post(`/assignments/${id}/submissions/${submissionId}/comments`, { content });
      setNewComment((prev) => ({ ...prev, [submissionId]: '' }));
      const res = await api.get(`/assignments/${id}/submissions/${submissionId}/comments`);
      setComments((prev) => ({ ...prev, [submissionId]: res.data }));
    } catch { toast.error('Failed to send'); }
    finally { setSendingComment((prev) => ({ ...prev, [submissionId]: false })); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button onClick={() => router.push('/assignments')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to Assignments
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{assignment.title}</h1>
        <p className="text-sm text-slate-500 mb-3">{assignment.subject} &bull; {assignment.topic} &bull; Grade {assignment.grade}</p>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{assignment.questionCount} questions</span>
          <span className="flex items-center gap-1"><User className="w-4 h-4" />{assignment.submittedCount} submitted</span>
          <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" />{assignment.gradedCount} graded</span>
          <span className="font-medium text-indigo-600">{assignment.totalPoints} pts</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">Student Submissions</h2>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const subComments = comments[submission.id] || [];
            const isExpanded = expandedSubmission === submission.id;
            const isDetailOpen = submissionDetail?.submission?.id === submission.id;

            return (
              <div key={submission.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">
                          Student: {submission.studentId?.slice(0, 8)}...
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {submission.status === 'graded' ? `Graded: ${submission.score}/${submission.totalPoints}` : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(submission.submittedAt).toLocaleString()}</span>
                        <span>{submission.answers?.length || 0} answers</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {submission.status === 'submitted' && (
                        <>
                          <button onClick={() => handleAutoGrade(submission.id)} disabled={gradingLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                            {gradingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />} Auto-Grade
                          </button>
                          <button onClick={() => { setSelectedSubmission(submission.id); setManualScore(''); }}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600">
                            <Send className="w-4 h-4" /> Manual
                          </button>
                        </>
                      )}
                      <button onClick={() => viewDetails(submission.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200">
                        <Brain className="w-4 h-4" /> Details
                      </button>
                      <button onClick={() => toggleExpand(submission.id)}
                        className="flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl text-sm font-medium transition">
                        <MessageSquare className="w-4 h-4" /> ({subComments.length})
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {selectedSubmission === submission.id && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-sm font-medium text-amber-800 mb-2">Enter score (0-{assignment.totalPoints})</p>
                      <div className="flex items-center gap-3">
                        <input type="number" value={manualScore} onChange={(e) => setManualScore(e.target.value)}
                          min={0} max={assignment.totalPoints}
                          className="w-32 px-3 py-2 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500" placeholder="Score" />
                        <button onClick={() => handleManualGrade(submission.id)} disabled={gradingLoading}
                          className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
                          {gradingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Grade'}
                        </button>
                        <button onClick={() => setSelectedSubmission(null)} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submission Detail Panel */}
                <AnimatePresence>
                  {isDetailOpen && submissionDetail && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-200"
                    >
                      <div className="p-6 space-y-6">
                        {/* Performance Report */}
                        <div className={`rounded-2xl p-5 border ${
                          submissionDetail.performanceReport?.includes('Excellent')
                            ? 'bg-emerald-50 border-emerald-200'
                            : submissionDetail.performanceReport?.includes('Good')
                            ? 'bg-blue-50 border-blue-200'
                            : submissionDetail.performanceReport?.includes('intervention')
                            ? 'bg-red-50 border-red-200'
                            : 'bg-amber-50 border-amber-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-slate-900">AI Performance Report</h3>
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-line">{submissionDetail.performanceReport}</p>
                        </div>

                        {/* Question-by-question breakdown */}
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500" />
                          Answer Breakdown
                        </h4>
                        <div className="space-y-4">
                          {detailLoading ? (
                            <div className="text-center py-8 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading details...</div>
                          ) : (
                            submissionDetail.questions?.map((q: any, i: number) => (
                              <div key={q.id} className={`rounded-xl border p-4 ${
                                q.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                              }`}>
                                <div className="flex items-start gap-3">
                                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    q.isCorrect ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'
                                  }`}>{i + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <HtmlContent html={q.content} className="text-sm font-semibold text-slate-900 mb-2" renderMath={true} />
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <p className="text-slate-400 font-medium">Student Answer</p>
                                        <p className={`font-semibold ${q.isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                                          {q.studentAnswerText || '(no answer)'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-slate-400 font-medium">Correct Answer</p>
                                        <p className="font-semibold text-emerald-600">{q.correctAnswerText}</p>
                                      </div>
                                    </div>
                                    {q.explanation && (
                                      <div className="mt-2 p-2 bg-white rounded-lg border border-slate-100">
                                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1">Explanation</p>
                                        <HtmlContent html={q.explanation} className="text-xs text-slate-600" renderMath={true} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0">
                                    {q.isCorrect ? (
                                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                      <X className="w-5 h-5 text-red-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Q&A Section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50">
                    <div className="p-6 space-y-4">
                      <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-indigo-500" /> Teacher-Student Q&A
                      </h4>
                      {subComments.length === 0 && <p className="text-sm text-slate-400">No comments yet.</p>}
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {subComments.map((comment: any) => {
                          const isTeacher = comment.authorRole === 'teacher';
                          return (
                            <div key={comment.id} className={`flex ${isTeacher ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isTeacher ? 'bg-indigo-100 text-indigo-900' : 'bg-white border border-slate-200 text-slate-800'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold uppercase tracking-wider">{isTeacher ? 'You' : 'Student'}</span>
                                  <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="text" value={newComment[submission.id] || ''}
                          onChange={(e) => setNewComment((prev) => ({ ...prev, [submission.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendComment(submission.id)}
                          placeholder="Write a comment or feedback..."
                          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={() => handleSendComment(submission.id)}
                          disabled={sendingComment[submission.id] || !newComment[submission.id]?.trim()}
                          className="flex items-center gap-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                          {sendingComment[submission.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
