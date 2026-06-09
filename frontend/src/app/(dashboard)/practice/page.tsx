'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { ArrowRight, CheckCircle2, XCircle, HelpCircle, Award, Zap, Loader2, Sparkles, Brain, BookOpen, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import HtmlContent from '@/components/ui/HtmlContent';

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
  options: { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: string;
  topic?: Topic;
}

interface PracticeSession {
  id: string;
  userId: string;
  subjectId: string;
  topicId?: string;
  grade: number;
  status: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number;
}

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export default function PracticePage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<typeof DIFFICULTIES[number]>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedGrade, setSelectedGrade] = useState<number>(Number(user?.grade) || 4);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<PracticeSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data || []);
      if (!selectedSubjectId && res.data?.length) {
        setSelectedSubjectId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load subjects', err);
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
      if (res.data && !res.data.some((topic: Topic) => topic.id === selectedTopicId)) {
        setSelectedTopicId('');
      }
    } catch (err) {
      console.error('Failed to load topics', err);
      setTopics([]);
    }
  };

  const fetchPracticeConfig = async () => {
    try {
      const res = await api.get('/settings/practice');
      const config = res.data;
      if (config?.defaultQuestions) {
        setQuestionCount(config.defaultQuestions);
      }
    } catch (err) {
      console.error('Failed to load practice settings', err);
    }
  };

  const fetchAdaptiveSettings = async () => {
    try {
      const res = await api.get('/onboarding/session');
      const session = res.data;
      if (session?.adaptiveSettings) {
        const { difficultyPreference } = session.adaptiveSettings;
        if (difficultyPreference === 'beginner') setSelectedDifficulty('easy');
        else if (difficultyPreference === 'advanced') setSelectedDifficulty('hard');
      }
    } catch (err) {
      // Onboarding may not be completed; use defaults
    }
  };

  const applyQueryParams = () => {
    const subjectId = searchParams?.get('subjectId');
    const topicId = searchParams?.get('topicId');
    const difficulty = searchParams?.get('difficulty') as typeof DIFFICULTIES[number];
    const gradeParam = searchParams?.get('grade');

    if (subjectId && subjects.some((subject) => subject.id === subjectId)) {
      setSelectedSubjectId(subjectId);
    }

    if (topicId) {
      setSelectedTopicId(topicId);
    }

    if (difficulty && DIFFICULTIES.includes(difficulty)) {
      setSelectedDifficulty(difficulty);
    }

    if (gradeParam) {
      const parsed = parseInt(gradeParam, 10);
      if (!isNaN(parsed)) {
        setSelectedGrade(parsed);
      }
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchPracticeConfig();
    fetchAdaptiveSettings();
  }, []);

  useEffect(() => {
    if (subjects.length > 0) {
      applyQueryParams();
    }
  }, [subjects]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchTopics(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (searchParams?.get('subjectId') && selectedSubjectId && !sessionId) {
      startPractice();
    }
  }, [selectedSubjectId, selectedTopicId, sessionId]);

  const fetchSession = async (id: string) => {
    try {
      const res = await api.get(`/practice/session/${id}`);
      setSessionStatus(res.data);
      return res.data as PracticeSession;
    } catch (err) {
      console.error('Failed to fetch session', err);
      return null;
    }
  };

  const fetchCurrentQuestion = async (id: string) => {
    setIsQuestionLoading(true);
    setError('');

    try {
      const res = await api.get(`/practice/session/${id}/current-question`);
      setCurrentQuestion(res.data.question);
      await fetchSession(id);
      setSelectedOption(null);
      setIsSubmitted(false);
    } catch (err: any) {
      console.error('Failed to fetch current question', err);
      setError(err?.response?.data?.message || 'Unable to load the next question.');
    } finally {
      setIsQuestionLoading(false);
    }
  };

  const startPractice = async () => {
    if (!selectedSubjectId) {
      setError('Please select a subject first.');
      return;
    }

    setIsStarting(true);
    setError('');
    setFeedback('');

    try {
      const res = await api.post('/practice/session', {
        subjectId: selectedSubjectId,
        topicId: selectedTopicId || undefined,
        grade: selectedGrade,
        questionCount,
        difficulty: selectedDifficulty,
      });

      const newSession = res.data;
      setSessionId(newSession.id);
      setAvailableCount(newSession.totalQuestions);
      await fetchSession(newSession.id);
      await fetchCurrentQuestion(newSession.id);
    } catch (err: any) {
      console.error('Unable to start session', err);
      setError(err?.response?.data?.message || 'Unable to start adaptive practice.');
    } finally {
      setIsStarting(false);
    }
  };

  const submitAnswer = async () => {
    if (!sessionId || !currentQuestion || !selectedOption) return;

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/practice/answer', {
        sessionId,
        questionId: currentQuestion.id,
        userAnswer: selectedOption,
      });

      const explanationRes = await api.get(`/practice/explanation/${sessionId}/${currentQuestion.id}`);
      setCurrentQuestion((prev) => prev ? { ...prev, explanation: explanationRes.data.explanation } : prev);
      await fetchSession(sessionId);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit answer', err);
      setError(err?.response?.data?.message || 'Unable to submit the answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;
    setIsQuestionLoading(true);
    setError('');

    try {
      const res = await api.post(`/practice/session/${sessionId}/complete`);
      setSessionStatus(res.data);
      const nextScore = Number(res.data.score || 0);
      if (nextScore < 60) {
        setSelectedDifficulty('easy');
        setFeedback('Your next adaptive session will use easy questions to strengthen foundations.');
      } else if (nextScore < 85) {
        setSelectedDifficulty('medium');
        setFeedback('Great work! Your next session uses medium level questions to build skill.');
      } else {
        setSelectedDifficulty('hard');
        setFeedback('Excellent! The next session will be harder to challenge your mastery.');
      }
    } catch (err: any) {
      console.error('Failed to complete session', err);
      setError(err?.response?.data?.message || 'Unable to complete session.');
    } finally {
      setIsQuestionLoading(false);
    }
  };

  const handleNext = async () => {
    if (!sessionId || !sessionStatus) return;

    if (sessionStatus.answeredQuestions >= sessionStatus.totalQuestions) {
      await completeSession();
      return;
    }

    await fetchCurrentQuestion(sessionId);
  };

  const resetSession = () => {
    setSessionId(null);
    setSessionStatus(null);
    setCurrentQuestion(null);
    setSelectedOption(null);
    setIsSubmitted(false);
    setError('');
    setFeedback('');
  };

  if (!user) return null;

  const isCompleted = sessionStatus?.status === 'completed';
  const progressPercent = sessionStatus ? Math.round((sessionStatus.answeredQuestions / Math.max(sessionStatus.totalQuestions, 1)) * 100) : 0;
  const currentQuestionNumber = sessionStatus ? sessionStatus.answeredQuestions + 1 : 1;

  return (
    <div className="space-y-6 px-4 py-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Adaptive Practice</h1>
          <p className="text-slate-500 mt-1">Connect to the student question bank, submit answers, and get AI explanations as you improve.</p>
        </div>
        <Link href="/question-bank" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
          <BookOpen className="w-4 h-4" />
          Browse Question Bank
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Session setup</h2>
          <p className="text-sm text-slate-500">Select a subject, choose a topic, then start your adaptive practice session.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
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
              <label className="block text-sm font-medium text-slate-700">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as typeof DIFFICULTIES[number])}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                {DIFFICULTIES.map((level) => (
                  <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Questions</label>
              <input
                type="number"
                min={3}
                max={15}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {availableCount !== null && availableCount < questionCount && (
              <p className="text-xs text-amber-600">
                Only {availableCount} question(s) available for this subject (requested {questionCount}).
              </p>
            )}

            <button
              onClick={startPractice}
              disabled={isStarting || !selectedSubjectId}
              className="w-full rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sessionId ? 'Continue Adaptive Practice' : 'Start Adaptive Practice'}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {feedback && <p className="text-sm text-slate-600">{feedback}</p>}
          </div>
        </div>

        <div className="space-y-4">
          {sessionId && sessionStatus ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="bg-slate-50 p-6 border-b border-slate-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">Adaptive session</p>
                    <h2 className="mt-3 text-2xl font-bold text-slate-900">{sessionStatus.status === 'completed' ? 'Review your results' : 'Answer the next question'}</h2>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                    {sessionStatus.status.replace('_', ' ')}
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span>Grade {sessionStatus.grade}</span>
                  <span>{sessionStatus.totalQuestions} of {questionCount} questions</span>
                  {availableCount !== null && availableCount < questionCount && (
                    <span className="text-amber-600">({availableCount} available)</span>
                  )}
                  <span>{progressPercent}% complete</span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {isCompleted ? (
                <div className="p-6 space-y-6">
                  <div className="rounded-3xl bg-slate-50 p-6 text-center">
                    <Award className="mx-auto mb-4 h-12 w-12 text-amber-500" />
                    <p className="text-xl font-semibold text-slate-900">Session complete</p>
                    <p className="mt-2 text-slate-600">You answered {sessionStatus.correctAnswers} of {sessionStatus.totalQuestions} questions correctly and scored {Math.round(sessionStatus.score)}%.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <p className="text-sm text-slate-500">Accuracy</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{Math.round(sessionStatus.score)}%</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <p className="text-sm text-slate-500">Correct answers</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{sessionStatus.correctAnswers}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={resetSession}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Start a New Session
                    </button>
                    <Link
                      href="/question-bank"
                      className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Explore Question Bank
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {isQuestionLoading ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-indigo-600" />
                      Loading your next question...
                    </div>
                  ) : currentQuestion ? (
                    <div className="space-y-6">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                        <p className="text-sm uppercase tracking-[0.2em] text-indigo-600">Question {currentQuestionNumber}</p>
                        <HtmlContent html={currentQuestion.content} className="mt-4 text-xl font-semibold text-slate-900" renderMath={true} />
                      </div>
                      <div className="space-y-4">
                        {currentQuestion.options.map((option) => {
                          const isSelected = selectedOption === option.id;
                          const correctOptionIds = currentQuestion.options.filter((opt) => opt.isCorrect).map((opt) => opt.id);
                          const isCorrect = isSubmitted && correctOptionIds.includes(option.id);
                          const isWrong = isSubmitted && isSelected && !isCorrect;

                          return (
                            <button
                              key={option.id}
                              onClick={() => !isSubmitted && setSelectedOption(option.id)}
                              className={clsx(
                                'w-full rounded-3xl border p-4 text-left transition',
                                isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/70',
                                isCorrect && 'border-emerald-500 bg-emerald-50 text-emerald-900',
                                isWrong && 'border-red-500 bg-red-50 text-red-900'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">{option.id.toUpperCase()}</span>
                                <span className="text-sm font-medium">{option.text}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-slate-500">
                          Topic: {currentQuestion.topic?.name || 'General'} • Difficulty: {currentQuestion.difficulty || 'medium'}
                        </div>
                        <button
                          onClick={submitAnswer}
                          disabled={!selectedOption || isSubmitting}
                          className={clsx(
                            'inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition',
                            selectedOption && !isSubmitting ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          )}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                        </button>
                      </div>

                      {isSubmitted && (
                        <div className={clsx(
                          'rounded-3xl border p-5',
                          selectedOption === currentQuestion.correctAnswer || currentQuestion.options.some((opt) => opt.id === selectedOption && opt.isCorrect)
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-amber-200 bg-amber-50'
                        )}
                        >
                          <div className="flex items-start gap-3">
                            {selectedOption === currentQuestion.correctAnswer || currentQuestion.options.some((opt) => opt.id === selectedOption && opt.isCorrect) ? (
                              <CheckCircle2 className="mt-1 w-6 h-6 text-emerald-600" />
                            ) : (
                              <HelpCircle className="mt-1 w-6 h-6 text-amber-600" />
                            )}
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {selectedOption === currentQuestion.correctAnswer || currentQuestion.options.some((opt) => opt.id === selectedOption && opt.isCorrect)
                                  ? `Perfect, ${user?.firstName || 'Student'}!`
                                  : `Not quite right, ${user?.firstName || 'Student'}. Let's review.`}
                              </h4>
                              <HtmlContent html={currentQuestion.explanation} className="mt-2 text-sm leading-6 text-slate-700" renderMath={true} />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={handleNext}
                          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                          {sessionStatus.answeredQuestions >= sessionStatus.totalQuestions ? 'Finish Session' : 'Next Question'}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-indigo-600" />
                      Preparing your adaptive practice session...
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 text-slate-700">
                <Search className="w-5 h-5" />
                <p className="font-semibold">Session not started yet.</p>
              </div>
              <p className="mt-4 text-slate-500">Select a subject and topic above, then start practice to connect to the published question bank.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
