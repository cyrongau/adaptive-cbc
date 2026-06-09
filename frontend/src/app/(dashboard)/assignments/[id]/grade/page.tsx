'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, User, CheckCircle, FileText, Loader2, Star, Send } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  topic: string;
  grade: number;
  totalPoints: number;
  questionCount: number;
  submittedCount: number;
  gradedCount: number;
}

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
  gradedBy: string;
}

export default function GradeAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [manualScore, setManualScore] = useState('');
  const [gradingLoading, setGradingLoading] = useState(false);

  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (!isTeacher) {
      router.push('/assignments');
      return;
    }
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        api.get(`/assignments/${id}`),
        api.get(`/assignments/${id}/submissions`),
      ]);
      setAssignment(assignmentRes.data);
      setSubmissions(submissionsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
      router.push('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGrade = async (submissionId: string) => {
    setGradingLoading(true);
    try {
      await api.post(`/assignments/${id}/submissions/${submissionId}/auto-grade`);
      toast.success('Auto-graded successfully!');
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Auto-grade failed');
    } finally {
      setGradingLoading(false);
    }
  };

  const handleManualGrade = async (submissionId: string) => {
    const score = parseInt(manualScore);
    if (isNaN(score) || score < 0 || (assignment && score > assignment.totalPoints)) {
      toast.error(`Score must be between 0 and ${assignment?.totalPoints}`);
      return;
    }

    setGradingLoading(true);
    try {
      await api.post(`/assignments/${id}/submissions/${submissionId}/grade`, { score });
      toast.success('Graded successfully!');
      setSelectedSubmission(null);
      setManualScore('');
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Grading failed');
    } finally {
      setGradingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isTeacher || !assignment) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/assignments')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assignments
      </button>

      {/* Assignment header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{assignment.title}</h1>
        <p className="text-sm text-slate-500 mb-3">
          {assignment.subject} &bull; {assignment.topic} &bull; Grade {assignment.grade}
        </p>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {assignment.questionCount} questions
          </span>
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {assignment.submittedCount} submitted
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            {assignment.gradedCount} graded
          </span>
          <span className="font-medium text-indigo-600">{assignment.totalPoints} pts</span>
        </div>
      </div>

      {/* Submissions */}
      <h2 className="text-xl font-bold text-slate-900">Student Submissions</h2>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">
                      Student: {submission.studentId.slice(0, 8)}...
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      submission.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {submission.status === 'graded' ? `Graded: ${submission.score}/${submission.totalPoints}` : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </span>
                    <span>
                      Questions answered: {submission.answers?.length || 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {submission.status === 'submitted' && (
                    <>
                      <button
                        onClick={() => handleAutoGrade(submission.id)}
                        disabled={gradingLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {gradingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                        Auto-Grade
                      </button>
                      <button
                        onClick={() => { setSelectedSubmission(submission); setManualScore(''); }}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600"
                      >
                        <Send className="w-4 h-4" />
                        Manual
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Manual grade input */}
              {selectedSubmission?.id === submission.id && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    Enter score (0-{assignment.totalPoints})
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={manualScore}
                      onChange={(e) => setManualScore(e.target.value)}
                      min={0}
                      max={assignment.totalPoints}
                      className="w-32 px-3 py-2 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                      placeholder="Score"
                    />
                    <button
                      onClick={() => handleManualGrade(submission.id)}
                      disabled={gradingLoading}
                      className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                    >
                      {gradingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Grade'}
                    </button>
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
