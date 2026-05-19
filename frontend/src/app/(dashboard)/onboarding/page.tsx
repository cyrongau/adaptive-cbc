'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  User,
  GraduationCap,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Brain,
  Zap,
  Star,
  Loader2,
  AlertCircle,
  BarChart3,
  Target,
  Sparkles,
  Award
} from 'lucide-react';

interface OnboardingSession {
  currentStep: string;
  assessmentStatus: string;
  personalInfo?: {
    grade?: number;
    term?: number;
    stream?: string;
  };
}

interface AssessmentQuestion {
  id: string;
  subjectId: string;
  content: string;
  options: { id: string; text: string }[];
  difficulty: string;
  topic: string;
}

interface CompetencyResult {
  subjectId: string;
  competencyLevel: number;
  level: string;
  weakAreas: string[];
  recommendations: string[];
  totalQuestions: number;
  correctAnswers: number;
}

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const TERMS = [1, 2, 3];
const STREAMS = ['Science', 'Arts', 'Commerce', 'General'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, initialize } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    grade: user?.grade ? Number(user.grade) : 4,
    term: user?.term || 1,
    stream: '',
  });

  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [assessmentProgress, setAssessmentProgress] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [competencyResults, setCompetencyResults] = useState<CompetencyResult[]>([]);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.onboardingStatus === 'completed') {
        router.replace('/dashboard');
        return;
      }
      fetchSession();
    }
  }, [user]);

  const fetchSession = async () => {
    try {
      const response = await api.get('/onboarding/session');
      if (response.data?.personalInfo) {
        setFormData(prev => ({
          ...prev,
          grade: response.data.personalInfo.grade || prev.grade,
          term: response.data.personalInfo.term || prev.term,
          stream: response.data.personalInfo.stream || '',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      await savePersonalInfo();
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step === 3 && assessmentStarted && !isComplete) {
      return;
    }
    setStep(prev => prev - 1);
  };

  const savePersonalInfo = async () => {
    setSaving(true);
    try {
      await api.post('/onboarding/personal-info', formData);
      await initialize();
    } catch (error) {
      console.error('Failed to save personal info:', error);
    } finally {
      setSaving(false);
    }
  };

  const startAssessment = async () => {
    setAssessmentStarted(true);
    setAssessmentError(null);
    try {
      const startRes = await api.post('/onboarding/assessment/start');
      const res = await api.get('/onboarding/assessment/current-question');
      if (res.data?.question) {
        setCurrentQuestion(res.data.question);
        setTotalQuestions(res.data.total);
        setCurrentIndex(res.data.currentIndex);
        setAssessmentProgress(res.data.progress);
      } else {
        setIsComplete(true);
        await fetchCompetencyResults();
      }
    } catch (error) {
      console.error('Failed to start assessment:', error);
      setAssessmentError('Failed to load assessment questions. Please try again.');
      setAssessmentStarted(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return;
    setSubmittingAnswer(true);
    try {
      const res = await api.post('/onboarding/assessment/answer', {
        subjectId: currentQuestion.subjectId,
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        timeSpent: 10,
      });

      setSelectedAnswer(null);

      if (res.data.isComplete) {
        setIsComplete(true);
        await completeAssessment();
      } else if (res.data.nextQuestion) {
        setCurrentQuestion(res.data.nextQuestion);
        setCurrentIndex(res.data.currentIndex);
        setAssessmentProgress(res.data.progress);
        setTotalQuestions(res.data.total);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const completeAssessment = async () => {
    try {
      const res = await api.post('/onboarding/assessment/complete');
      if (res.data?.baselineCompetency) {
        setCompetencyResults(res.data.baselineCompetency);
      }
    } catch (error) {
      console.error('Failed to complete assessment:', error);
    }
  };

  const fetchCompetencyResults = async () => {
    try {
      const res = await api.get('/onboarding/baseline-competency');
      if (res.data?.length > 0) {
        setCompetencyResults(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch competency:', error);
    }
  };

  const handleCompleteOnboarding = async () => {
    setSaving(true);
    try {
      await api.post('/onboarding/complete');
      await initialize();
      router.replace('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkipAssessment = () => {
    setStep(prev => prev + 1);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isIndigo = !(Number(user.grade) === 6 || Number(user.grade) === 9);
  const primaryBg = isIndigo ? 'bg-indigo-600' : 'bg-amber-600';
  const primaryHover = isIndigo ? 'hover:bg-indigo-700' : 'hover:bg-amber-700';
  const primaryLight = isIndigo ? 'bg-indigo-100' : 'bg-amber-100';
  const primaryText = isIndigo ? 'text-indigo-600' : 'text-amber-600';

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-amber-100 text-amber-700',
      hard: 'bg-red-100 text-red-700',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-700';
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      advanced: 'bg-green-100 text-green-700',
      intermediate: 'bg-blue-100 text-blue-700',
      beginner: 'bg-amber-100 text-amber-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? `${primaryBg} text-white` : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {i < 3 && (
                <div className={`w-16 h-1 mx-2 ${step > s ? primaryBg : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl ${primaryLight} flex items-center justify-center`}>
                  <User className={`w-6 h-6 ${primaryText}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                  <p className="text-slate-500">Tell us about yourself</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    Current Grade
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {GRADES.map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Current Term
                  </label>
                  <div className="flex gap-3">
                    {TERMS.map(t => (
                      <button
                        key={t}
                        onClick={() => setFormData({ ...formData, term: t })}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                          formData.term === t
                            ? `${primaryBg} text-white`
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Term {t}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.grade >= 9 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Stream (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {STREAMS.map(s => (
                        <button
                          key={s}
                          onClick={() => setFormData({ ...formData, stream: s })}
                          className={`py-3 rounded-xl font-semibold transition-all ${
                            formData.stream === s
                              ? `${primaryBg} text-white`
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className={`flex items-center gap-2 px-6 py-3 ${primaryBg} ${primaryHover} text-white rounded-xl font-bold transition-all`}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl ${primaryLight} flex items-center justify-center`}>
                  <BookOpen className={`w-6 h-6 ${primaryText}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Learning Goals</h2>
                  <p className="text-slate-500">Set your learning objectives</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <p className="text-slate-600">
                  Your learning profile has been set up with Grade {formData.grade}, Term {formData.term}.
                  You can adjust your preferences later from the dashboard.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className={`flex items-center gap-2 px-6 py-3 ${primaryBg} ${primaryHover} text-white rounded-xl font-bold transition-all`}
                >
                  <ChevronRight className="w-5 h-5" />
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && !assessmentStarted && (
            <motion.div
              key="step3-intro"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl ${primaryLight} flex items-center justify-center`}>
                  <Brain className={`w-6 h-6 ${primaryText}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Learning Assessment</h2>
                  <p className="text-slate-500">Let's determine your pace of study</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <Zap className={`w-8 h-8 ${primaryText}`} />
                  <div>
                    <h3 className="font-bold text-slate-900">AI-Powered Adaptive Assessment</h3>
                    <p className="text-sm text-slate-500">Complete a quick assessment to personalize your learning path</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Based on your responses, our AI will determine your current competency level 
                  across each subject and create a personalized learning path with the right pace for you.
                  Questions will adapt to your performance in real time.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Brain className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-bold text-blue-900">AI Generated</p>
                  <p className="text-xs text-blue-700">Smart questions</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm font-bold text-green-900">Competency</p>
                  <p className="text-xs text-green-700">Baseline analysis</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-sm font-bold text-purple-900">Adaptive</p>
                  <p className="text-xs text-purple-700">Personalized path</p>
                </div>
              </div>

              {assessmentError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{assessmentError}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => { setAssessmentError(null); setStep(prev => prev - 1); }}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleSkipAssessment}
                    className="px-6 py-3 text-slate-500 rounded-xl font-bold hover:bg-slate-100 transition-all"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={startAssessment}
                    className={`flex items-center gap-2 px-6 py-3 ${primaryBg} ${primaryHover} text-white rounded-xl font-bold transition-all`}
                  >
                    <Brain className="w-5 h-5" />
                    Start Assessment
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && assessmentStarted && !isComplete && currentQuestion && (
            <motion.div
              key="step3-question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${primaryLight} flex items-center justify-center`}>
                    <Brain className={`w-6 h-6 ${primaryText}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Learning Assessment</h2>
                    <p className="text-slate-500 text-sm">Question {currentIndex + 1} of {totalQuestions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getDifficultyBadge(currentQuestion.difficulty)}`}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                    {currentQuestion.subjectId}
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
                <div className={`${primaryBg} h-full rounded-full transition-all duration-500`} style={{ width: `${assessmentProgress}%` }} />
              </div>

              <div className="mb-8">
                <p className="text-lg font-semibold text-slate-900 leading-relaxed">
                  {currentQuestion.content}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedAnswer(option.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      selectedAnswer === option.id
                        ? `${primaryLight} ${primaryText} border-${isIndigo ? 'indigo' : 'amber'}-400`
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      selectedAnswer === option.id
                        ? `${primaryBg} text-white`
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {option.id.toUpperCase()}
                    </div>
                    <span className={`font-medium ${
                      selectedAnswer === option.id ? 'text-slate-900' : 'text-slate-700'
                    }`}>
                      {option.text}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => { setAssessmentStarted(false); setIsComplete(false); setStep(prev => prev + 1); }}
                  className="text-sm text-slate-400 hover:text-slate-600 font-semibold transition-colors"
                >
                  Skip Assessment
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer || submittingAnswer}
                  className={`flex items-center gap-2 px-8 py-3 ${
                    selectedAnswer ? `${primaryBg} ${primaryHover} text-white` : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  } rounded-xl font-bold transition-all`}
                >
                  {submittingAnswer ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                  {currentIndex + 1 >= totalQuestions ? 'Finish' : 'Next Question'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && isComplete && (
            <motion.div
              key="step3-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Assessment Complete!</h2>
                <p className="text-slate-500 mt-2">Here's your personalized baseline analysis</p>
              </div>

              <div className="space-y-4 mb-8">
                {competencyResults.map((result, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-900">{result.subjectId}</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getLevelBadge(result.level)}`}>
                        {result.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1 bg-slate-200 rounded-full h-2.5">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            result.competencyLevel >= 70 ? 'bg-green-500' :
                            result.competencyLevel >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${result.competencyLevel}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 shrink-0">{result.competencyLevel}%</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                      <span>{result.correctAnswers}/{result.totalQuestions} correct</span>
                    </div>
                    {result.weakAreas.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Focus areas:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.weakAreas.slice(0, 3).map((area, i) => (
                            <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                              {area.length > 30 ? area.slice(0, 30) + '...' : area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 mb-6 border border-indigo-100">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">AI Adaptive Settings Applied</h3>
                    <p className="text-sm text-slate-600">
                      Based on your results, we've configured your learning path with the right difficulty level and pace.
                      Your content will adapt as you progress through your studies.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setStep(prev => prev + 1)}
                  className={`flex items-center gap-2 px-8 py-4 ${primaryBg} ${primaryHover} text-white rounded-xl font-bold transition-all text-lg`}
                >
                  <ChevronRight className="w-5 h-5" />
                  Continue to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">You're All Set!</h2>
                <p className="text-slate-500 mt-2">Your personalized learning journey begins now</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-slate-900 mb-4">What happens next:</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    Your adaptive learning path has been generated
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    Content difficulty adjusts to your skill level
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    Progress is tracked and AI recommendations provided
                  </li>
                </ul>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleCompleteOnboarding}
                  disabled={saving}
                  className={`flex items-center gap-2 px-8 py-4 ${primaryBg} ${primaryHover} text-white rounded-xl font-bold transition-all text-lg`}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
