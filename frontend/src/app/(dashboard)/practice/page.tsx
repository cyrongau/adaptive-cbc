'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { ArrowRight, CheckCircle2, XCircle, HelpCircle, Award, Zap, Loader2, Sparkles, Brain, BookOpen, Search, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import HtmlContent from '@/components/ui/HtmlContent';
import XpAnimation from '@/components/ui/XpAnimation';

const DrawingCanvas = dynamic(() => import('@/components/ui/DrawingCanvas'), { ssr: false });

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
  type?: string;
  options: { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: string;
  topic?: Topic;
  mediaUrl?: string;
  mediaType?: string;
  questionMedia?: { type: string; url: string; alt?: string }[];
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
  const canvasRef = React.useRef<any>(null);
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
  const [xpAnimation, setXpAnimation] = useState<{ amount: number; isFirstAttempt: boolean } | null>(null);
  const [lastAnswerXp, setLastAnswerXp] = useState(0);
  const [adaptiveDifficultyLabel, setAdaptiveDifficultyLabel] = useState('');

  // Brain Break state
  const [showBrainBreak, setShowBrainBreak] = useState(false);
  const [brainBreakGame, setBrainBreakGame] = useState<any>(null);
  const [isGeneratingGame, setIsGeneratingGame] = useState(false);
  const [lastBrainBreakMilestone, setLastBrainBreakMilestone] = useState(0);
  const [bbQuestionIndex, setBbQuestionIndex] = useState(0);

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
    if (!sessionId || !currentQuestion) return;
    
    let answerPayload = selectedOption;
    if (currentQuestion.type === 'drawing_canvas') {
      if (!canvasRef.current) return;
      if (canvasRef.current.isEmpty()) {
        setError('Please draw an answer before submitting.');
        return;
      }
      const dataUrl = await canvasRef.current.getSvgOrImage();
      if (!dataUrl) {
        setError('Failed to get drawing data');
        return;
      }
      answerPayload = dataUrl;
    } else {
      if (!selectedOption) return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.post('/practice/answer', {
        sessionId,
        questionId: currentQuestion.id,
        userAnswer: answerPayload,
      });

      const xpData = res.data;
      if (xpData.xpAwarded > 0) {
        setLastAnswerXp(xpData.xpAwarded);
        setXpAnimation({ amount: xpData.xpAwarded, isFirstAttempt: xpData.isFirstAttempt });
      } else {
        setLastAnswerXp(0);
      }

      const explanationRes = await api.get(`/practice/explanation/${sessionId}/${currentQuestion.id}`);
      setCurrentQuestion((prev) => prev ? { ...prev, explanation: explanationRes.data.explanation } : prev);
      const session = await fetchSession(sessionId);
      if (session) {
        const score = session.score || 0;
        if (score < 40) {
          setAdaptiveDifficultyLabel('Difficulty adjusting down — focusing on foundations');
        } else if (score > 80 && session.answeredQuestions >= 3) {
          setAdaptiveDifficultyLabel('You are doing well! Ready for harder questions.');
        } else {
          setAdaptiveDifficultyLabel('');
        }
      }
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

    // Trigger Brain Break every 10 questions
    if (sessionStatus.answeredQuestions > 0 && sessionStatus.answeredQuestions % 10 === 0 && lastBrainBreakMilestone !== sessionStatus.answeredQuestions) {
      setShowBrainBreak(true);
      setLastBrainBreakMilestone(sessionStatus.answeredQuestions);
      generateBrainBreakGame();
      return;
    }

    await fetchCurrentQuestion(sessionId);
  };

  const generateBrainBreakGame = async () => {
    setIsGeneratingGame(true);
    try {
      const subjectName = subjects.find(s => s.id === selectedSubjectId)?.name || 'General Knowledge';
      const topicName = topics.find(t => t.id === selectedTopicId)?.name;
      
      let bbDifficulty = 'medium';
      if (sessionStatus && sessionStatus.score !== undefined) {
        if (sessionStatus.score < 50) bbDifficulty = 'easy';
        else if (sessionStatus.score > 80) bbDifficulty = 'hard';
      }

      const res = await api.post('/gamification/games/generate', {
        subject: subjectName,
        grade: selectedGrade,
        topic: topicName,
        difficulty: bbDifficulty,
      });
      setBrainBreakGame(res.data);
      setBbQuestionIndex(0);
    } catch (err) {
      console.error('Failed to generate brain break', err);
      setShowBrainBreak(false);
      await fetchCurrentQuestion(sessionId!);
    } finally {
      setIsGeneratingGame(false);
    }
  };

  const handleBrainBreakAnswer = async (selected: string, correct: string) => {
    import('react-hot-toast').then(({ default: toast }) => {
      if (selected === correct) {
        toast.success('Correct! +10 Bonus XP', { icon: '⭐' });
        api.post('/gamification/games/score', { score: 10 }).catch(console.error);
      } else {
        toast.error(`Not quite! The correct answer was: ${correct}`);
      }
    });

    if (brainBreakGame && bbQuestionIndex < brainBreakGame.questions.length - 1) {
      setTimeout(() => setBbQuestionIndex(prev => prev + 1), 1500);
    } else {
      setTimeout(() => {
        setShowBrainBreak(false);
        setBrainBreakGame(null);
        fetchCurrentQuestion(sessionId!);
      }, 2000);
    }
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
                        {currentQuestion.questionMedia?.map((media, i) => (
                          <div key={i} className="mt-4 flex justify-center">
                            <img
                              src={media.url}
                              alt={media.alt || 'Question diagram'}
                              className="max-w-full h-auto rounded-xl border border-slate-200"
                              style={{ maxHeight: '400px' }}
                            />
                          </div>
                        ))}
                        {!currentQuestion.questionMedia?.length && currentQuestion.mediaUrl && (
                          <div className="mt-4 flex justify-center">
                            <img
                              src={currentQuestion.mediaUrl}
                              alt="Question diagram"
                              className="max-w-full h-auto rounded-xl border border-slate-200"
                              style={{ maxHeight: '400px' }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {currentQuestion.type === 'drawing_canvas' ? (
                          <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <DrawingCanvas ref={canvasRef} readOnly={isSubmitted} />
                          </div>
                        ) : (
                          currentQuestion.options.map((option) => {
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
                          })
                        )}
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
                        <div className="space-y-3">
                          {lastAnswerXp > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className="rounded-3xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-4 flex items-center gap-3"
                            >
                              <Zap className="w-6 h-6 text-amber-500" />
                              <div>
                                <p className="font-bold text-amber-800">+{lastAnswerXp} XP Earned!</p>
                                <p className="text-xs text-amber-600">First attempt bonus — keep it up!</p>
                              </div>
                            </motion.div>
                          )}
                          {adaptiveDifficultyLabel && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-3xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-3 flex items-center gap-2"
                            >
                              <TrendingUp className="w-4 h-4 text-indigo-500" />
                              <p className="text-xs font-medium text-indigo-700">{adaptiveDifficultyLabel}</p>
                            </motion.div>
                          )}
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

      {xpAnimation && (
        <XpAnimation
          xpAmount={xpAnimation.amount}
          isCorrect={true}
          isFirstAttempt={xpAnimation.isFirstAttempt}
          onComplete={() => setXpAnimation(null)}
        />
      )}

      {/* Brain Break Modal */}
      {showBrainBreak && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white text-center relative">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <h2 className="text-3xl font-black tracking-tight">Brain Break!</h2>
              <p className="text-indigo-100 font-medium mt-1">You answered 10 questions. Time for a quick mini-game!</p>
              
              <button 
                onClick={() => {
                  setShowBrainBreak(false);
                  fetchCurrentQuestion(sessionId!);
                }}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                Skip
              </button>
            </div>
            
            <div className="p-8 min-h-[300px] flex flex-col justify-center">
              {isGeneratingGame ? (
                <div className="text-center text-indigo-600">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                  <p className="font-bold animate-pulse">AI is crafting your game...</p>
                </div>
              ) : brainBreakGame ? (
                <div>
                  <div className="mb-6 text-center">
                    <span className="text-sm font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full">
                      {brainBreakGame.title} • Q{bbQuestionIndex + 1}/{brainBreakGame.questions.length}
                    </span>
                    <h3 className="text-2xl font-semibold text-slate-800 mt-6">
                      {brainBreakGame.questions[bbQuestionIndex].prompt}
                    </h3>
                  </div>
                  
                  <div className="grid gap-3">
                    {brainBreakGame.questions[bbQuestionIndex].options?.map((opt: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleBrainBreakAnswer(opt, brainBreakGame.questions[bbQuestionIndex].correctAnswer)}
                        className="p-4 border-2 border-slate-100 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 font-bold text-slate-700 transition-all active:scale-95"
                      >
                        {opt}
                      </button>
                    ))}
                    {!brainBreakGame.questions[bbQuestionIndex].options && (
                      <div className="flex gap-3">
                        <input type="text" className="flex-1 p-4 border-2 border-slate-200 rounded-xl" placeholder="Type answer..." id="bb-game-input" />
                        <button 
                         onClick={() => {
                           const val = (document.getElementById('bb-game-input') as HTMLInputElement).value;
                           handleBrainBreakAnswer(val, brainBreakGame.questions[bbQuestionIndex].correctAnswer);
                         }}
                         className="bg-indigo-600 text-white px-8 rounded-xl font-bold hover:bg-indigo-700"
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-red-500">Failed to load game.</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
