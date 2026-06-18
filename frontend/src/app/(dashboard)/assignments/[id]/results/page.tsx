'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, CheckCircle, XCircle, Clock, Star, Loader2, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import HtmlContent from '@/components/ui/HtmlContent';

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  answers: { questionId: string; answer: string; isCorrect?: boolean }[];
  score: number;
  totalPoints: number;
  status: string;
  submittedAt: string;
  gradedAt: string;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  topic: string;
  grade: number;
  totalPoints: number;
  questionCount: number;
}

interface Question {
  id: string;
  content: string;
  options: { id: string; text: string; isCorrect?: boolean }[];
  explanation?: string;
  mediaUrl?: string;
  mediaType?: string;
  questionMedia?: { type: string; url: string; alt?: string }[];
}

export default function AssignmentResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showQa, setShowQa] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        api.get(`/assignments/${id}`),
        api.get('/assignments/submissions/my'),
      ]);

      setAssignment(assignmentRes.data);

      const mySubmission = submissionsRes.data.find((s: Submission) => s.assignmentId === id);
      if (mySubmission) {
        setSubmission(mySubmission);
        try {
          const commentsRes = await api.get(`/assignments/${id}/submissions/${mySubmission.id}/comments`);
          setComments(commentsRes.data || []);
        } catch {}

        const questionIds = (mySubmission.answers || []).map((a: { questionId: string }) => a.questionId);
        if (questionIds.length > 0) {
          const questionsRes = await api.get('/questions', {
            params: { ids: questionIds.join(',') },
          });
          const data = questionsRes.data;
          setQuestions(data?.questions || (Array.isArray(data) ? data : []));
        }
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <button
          onClick={() => router.push('/assignments')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No submission found for this assignment.</p>
        </div>
      </div>
    );
  }

  const percentage = submission.totalPoints > 0
    ? Math.round((submission.score / submission.totalPoints) * 100)
    : 0;

  const answerMap = new Map(
    (submission.answers || []).map((a) => [a.questionId, a]),
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/assignments')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assignments
      </button>

      {/* Score card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 mb-4">
          <Star className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {assignment?.title || 'Assignment'} - Results
        </h1>
        <div className="text-5xl font-bold text-indigo-600 mb-2">
          {submission.score}/{submission.totalPoints}
        </div>
        <p className="text-lg text-slate-500 mb-4">{percentage}%</p>
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Submitted: {new Date(submission.submittedAt).toLocaleString()}
          </span>
          {submission.gradedAt && (
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Graded: {new Date(submission.gradedAt).toLocaleString()}
            </span>
          )}
        </div>
        {submission.status === 'submitted' && (
          <p className="mt-4 text-amber-600 text-sm bg-amber-50 px-4 py-2 rounded-xl inline-block">
            Waiting for grading
          </p>
        )}
      </div>

      {/* Answer review */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Answer Review</h2>
          {questions.map((question, index) => {
            const answer = answerMap.get(question.id);
            const selectedOption = answer
              ? question.options.find((o) => o.id === answer.answer)
              : null;
            const correctOption = question.options.find((o) => o.isCorrect);
            const isCorrect = answer?.isCorrect;

            return (
              <div key={question.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCorrect === true
                      ? 'bg-green-100 text-green-600'
                      : isCorrect === false
                      ? 'bg-red-100 text-red-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <HtmlContent html={question.content} className="text-base font-semibold text-slate-900" renderMath={true} />
                    {question.questionMedia?.map((media, i) => (
                      <div key={i} className="mt-3 flex justify-center">
                        <img src={media.url} alt={media.alt || 'Question diagram'} className="max-w-full h-auto rounded-xl border border-slate-200" style={{ maxHeight: '300px' }} />
                      </div>
                    ))}
                    {!question.questionMedia?.length && question.mediaUrl && (
                      <div className="mt-3 flex justify-center">
                        <img src={question.mediaUrl} alt="Question diagram" className="max-w-full h-auto rounded-xl border border-slate-200" style={{ maxHeight: '300px' }} />
                      </div>
                    )}
                  </div>
                  {isCorrect === true && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                  {isCorrect === false && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                </div>

                <div className="ml-11 space-y-2">
                  {question.options.map((option) => {
                    const isSelected = option.id === answer?.answer;
                    const isRight = option.isCorrect;
                    return (
                      <div
                        key={option.id}
                        className={`px-4 py-3 rounded-xl border text-sm ${
                          isSelected && isRight
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : isSelected && !isRight
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : isRight
                            ? 'border-green-300 bg-green-50/50 text-green-600'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.text}</span>
                          {isSelected && isRight && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {isSelected && !isRight && <XCircle className="w-4 h-4 text-red-500" />}
                          {!isSelected && isRight && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {question.explanation && (
                  <div className="ml-11 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Explanation</p>
                    <HtmlContent html={question.explanation} className="text-sm text-slate-600" renderMath={true} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Q&A Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowQa(!showQa)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900">Teacher Q&A</h2>
          </div>
          <span className="text-sm text-slate-400">{showQa ? 'Hide' : 'Show'} ({comments.length})</span>
        </button>

        {showQa && (
          <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">
            {comments.length === 0 && (
              <p className="text-sm text-slate-400">No feedback from your teacher yet.</p>
            )}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {comments.map((comment: any) => {
                const isTeacher = comment.authorRole === 'teacher';
                return (
                  <div key={comment.id} className={`flex ${isTeacher ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isTeacher ? 'bg-indigo-100 text-indigo-900' : 'bg-slate-100 text-slate-800'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {isTeacher ? 'Teacher' : 'You'}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && newComment.trim() && submission) {
                    e.preventDefault();
                    setSendingComment(true);
                    try {
                      await api.post(`/assignments/${id}/submissions/${submission.id}/comments`, { content: newComment.trim() });
                      setNewComment('');
                      const res = await api.get(`/assignments/${id}/submissions/${submission.id}/comments`);
                      setComments(res.data || []);
                    } catch { toast.error('Failed to send'); }
                    finally { setSendingComment(false); }
                  }
                }}
                placeholder="Reply to your teacher..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={async () => {
                  if (!newComment.trim() || !submission) return;
                  setSendingComment(true);
                  try {
                    await api.post(`/assignments/${id}/submissions/${submission.id}/comments`, { content: newComment.trim() });
                    setNewComment('');
                    const res = await api.get(`/assignments/${id}/submissions/${submission.id}/comments`);
                    setComments(res.data || []);
                  } catch { toast.error('Failed to send'); }
                  finally { setSendingComment(false); }
                }}
                disabled={sendingComment || !newComment.trim()}
                className="flex items-center gap-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
