'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';
import { Search, Loader2, BookOpen, ChevronRight, CheckCircle, XCircle, Zap } from 'lucide-react';
import HtmlContent, { stripHtml } from '@/components/ui/HtmlContent';

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
}

interface Question {
  id: string;
  content: string;
  difficulty?: string;
  grade: number;
  topic?: Topic;
  subjectId: string;
  options?: { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
  explanation?: string;
}

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function QuestionBankPage() {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [revealedQuestionIds, setRevealedQuestionIds] = useState<string[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [questionResults, setQuestionResults] = useState<Record<string, { correct: boolean; xpAwarded: number } | null>>({});
  const [submittingQuestions, setSubmittingQuestions] = useState<Record<string, boolean>>({});

  const limit = 12;

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data || []);
    } catch (error) {
      console.error('Failed to load subjects', error);
      setSubjects([]);
    }
  };

  const fetchTopics = async (subjectId: string) => {
    if (!subjectId) {
      setTopics([]);
      setSelectedTopicId('');
      return;
    }

    try {
      const res = await api.get(`/subjects/${subjectId}/topics`);
      setTopics(res.data || []);
      if (res.data?.length && !res.data.some((topic: Topic) => topic.id === selectedTopicId)) {
        setSelectedTopicId('');
      }
    } catch (error) {
      console.error('Failed to load topics', error);
      setTopics([]);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        status: 'published',
        page,
        limit,
      };
      if (selectedGrade !== '') params.grade = selectedGrade;
      if (selectedSubjectId) params.subjectId = selectedSubjectId;
      if (selectedTopicId) params.topicId = selectedTopicId;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/questions', { params });
      setQuestions(res.data.questions || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Failed to load question bank', error);
      setQuestions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchTopics(selectedSubjectId);
  }, [selectedSubjectId]);

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubjectId, selectedTopicId, selectedGrade, searchTerm, page]);

  const toggleReveal = (questionId: string) => {
    setRevealedQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    );
  };

  const submitAnswer = async (questionId: string) => {
    const answer = (questionAnswers[questionId] || '').trim();
    if (!answer) return;

    setSubmittingQuestions((prev) => ({ ...prev, [questionId]: true }));
    try {
      const res = await api.post(`/questions/${questionId}/check`, { answer });
      setQuestionResults((prev) => ({ ...prev, [questionId]: res.data }));
    } catch (err) {
      console.error('Failed to check answer', err);
    } finally {
      setSubmittingQuestions((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const isStudent = user?.role === 'student';

  if (!user) return null;

  return (
    <div className="space-y-6 px-4 py-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Student Question Bank</h1>
          <p className="text-slate-500 mt-1">Browse published exam questions and launch adaptive practice directly from the question bank.</p>
        </div>
        <Link href="/practice" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
          <BookOpen className="w-4 h-4" />
          Go to Adaptive Practice
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Topic</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">All topics</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Grade</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">All grades</option>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Search questions</label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search question text..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">Question Bank</p>
                <h2 className="text-2xl font-bold text-slate-900">Published questions</h2>
              </div>
              <div className="text-sm text-slate-500">{total.toLocaleString()} results</div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-indigo-600" />
              Loading questions...
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
              No published questions found for this filter.
            </div>
          ) : (
            <div className="grid gap-4">
              {questions.map((question) => (
                <article key={question.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <span>Grade {question.grade}</span>
                        <span>{question.difficulty ? question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) : 'Medium'}</span>
                        {question.topic && <span>{question.topic.name}</span>}
                      </div>
                      <HtmlContent html={question.content} className="text-base font-semibold text-slate-900" renderMath={true} />
                    </div>
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      {isStudent && (
                        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                          {!questionResults[question.id] ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <input
                                type="text"
                                value={questionAnswers[question.id] || ''}
                                onChange={(e) => setQuestionAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                                placeholder="Type your answer..."
                                className="w-40 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              />
                              <button
                                type="button"
                                onClick={() => submitAnswer(question.id)}
                                disabled={submittingQuestions[question.id]}
                                className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {submittingQuestions[question.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                Submit
                              </button>
                            </div>
                          ) : (
                            <div className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${questionResults[question.id]?.correct ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {questionResults[question.id]?.correct ? (
                                <><CheckCircle className="w-4 h-4" /> Correct!</>
                              ) : (
                                <><XCircle className="w-4 h-4" /> Incorrect</>
                              )}
                              {questionResults[question.id] && (
                                <span className="ml-1 text-xs opacity-75">+{questionResults[question.id]!.xpAwarded} XP</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <Link
                        href={`/practice?subjectId=${encodeURIComponent(question.subjectId)}&topicId=${encodeURIComponent(question.topic?.id || '')}&grade=${question.grade}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        Attempt
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleReveal(question.id)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                      >
                        {revealedQuestionIds.includes(question.id) ? 'Hide answer' : 'Reveal answer'}
                      </button>
                    </div>
                  </div>

                  {revealedQuestionIds.includes(question.id) && (
                    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
                      {question.options && question.options.length > 0 ? (
                        <div className="space-y-3">
                          <div className="font-semibold text-slate-900">Options</div>
                          <div className="grid gap-2">
                            {question.options.map((option) => (
                              <div key={option.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <span className="font-semibold">{option.id.toUpperCase()}.</span> {option.text}
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="font-semibold text-slate-900">Answer</div>
                            <p>{question.correctAnswer || question.options.find((opt) => opt.isCorrect)?.id}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-900">Answer</div>
                          <p>{question.correctAnswer || 'Answer unavailable'}</p>
                        </div>
                      )}
                      {question.explanation && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="font-semibold text-slate-900">Explanation</div>
                          <HtmlContent html={question.explanation} className="mt-2 text-sm text-slate-700" renderMath={true} />
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {total > limit && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Page {page} of {Math.ceil(total / limit)}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
