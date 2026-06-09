'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, FileText, Star, Loader2, CheckCircle, Send } from 'lucide-react';
import HtmlContent from '@/components/ui/HtmlContent';

interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  grade: number;
  totalPoints: number;
  dueDate: string;
  status: string;
  questionCount: number;
}

interface Question {
  id: string;
  content: string;
  options: { id: string; text: string; isCorrect?: boolean }[];
  difficulty?: string;
  topic?: { id: string; name: string };
}

interface SubjectItem {
  id: string;
  name: string;
}

interface TopicItem {
  id: string;
  name: string;
}

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssignment();
  }, [id]);

  const loadAssignment = async () => {
    try {
      const res = await api.get(`/assignments/${id}`);
      setAssignment(res.data);
    } catch (error) {
      toast.error('Failed to load assignment');
      router.push('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const findSubjectId = async (subjectName: string): Promise<string | null> => {
    try {
      const res = await api.get('/subjects');
      const subjects: SubjectItem[] = res.data;
      const match = subjects.find(
        (s) => s.name.toLowerCase() === subjectName.toLowerCase(),
      );
      return match?.id || null;
    } catch {
      return null;
    }
  };

  const findTopicId = async (subjectId: string, topicName: string): Promise<string | null> => {
    try {
      const res = await api.get(`/subjects/${subjectId}/topics`);
      const topics: TopicItem[] = res.data;
      const match = topics.find(
        (t) => t.name.toLowerCase() === topicName.toLowerCase(),
      );
      return match?.id || null;
    } catch {
      return null;
    }
  };

  const startAssignment = async () => {
    if (!assignment) return;
    setQuestionLoading(true);

    try {
      let subjectId = await findSubjectId(assignment.subject);
      let topicId: string | null = null;

      if (subjectId) {
        topicId = await findTopicId(subjectId, assignment.topic);
      }

      const params: Record<string, string | number> = {
        grade: assignment.grade,
        count: assignment.questionCount,
      };
      if (subjectId) params.subjectId = subjectId;
      if (topicId) params.topicId = topicId;

      const res = await api.get('/questions/random', { params });
      const fetched = res.data;

      if (!fetched || fetched.length === 0) {
        toast.error('No questions available matching this assignment criteria');
        setQuestionLoading(false);
        return;
      }

      setQuestions(fetched);
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!assignment) return;

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      toast.error(`Please answer all questions (${answeredCount}/${questions.length} answered)`);
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      await api.post(`/assignments/${id}/submit`, { answers: formattedAnswers });

      toast.success('Assignment submitted successfully!');

      try {
        const submissionRes = await api.get(`/assignments/submissions/my`);
        const submission = submissionRes.data.find((s: any) => s.assignmentId === id);
        if (submission) {
          await api.post(`/assignments/${id}/submissions/${submission.id}/auto-grade`);
        }
      } catch {
      }

      router.push(`/assignments/${id}/results`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!assignment) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
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
        {assignment.description && (
          <HtmlContent html={assignment.description} className="text-slate-600 mb-4" renderMath={true} />
        )}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {assignment.subject} &bull; {assignment.topic}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            Grade {assignment.grade}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {assignment.questionCount} questions
          </span>
          <span className="font-medium text-indigo-600">{assignment.totalPoints} pts</span>
        </div>
      </div>

      {/* Questions section */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          {questionLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-slate-500">Loading questions...</p>
            </div>
          ) : (
            <>
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg mb-2">Ready to start this assignment?</p>
              <p className="text-slate-400 text-sm mb-6">
                Questions will be selected from the question bank matching {assignment.subject}, Grade {assignment.grade}.
              </p>
              <button
                onClick={startAssignment}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
              >
                Start Assignment
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Answer all {questions.length} questions below
            </p>
            <p className="text-sm font-medium text-slate-700">
              {Object.keys(answers).length}/{questions.length} answered
            </p>
          </div>

          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <HtmlContent html={question.content} className="text-lg font-semibold text-slate-900" renderMath={true} />
                </div>
              </div>

              <div className="ml-11 space-y-2">
                {question.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(question.id, option.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      answers[question.id] === option.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm font-medium">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
