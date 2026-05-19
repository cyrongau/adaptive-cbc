'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Zap,
  Timer,
  Loader2,
  Sparkles,
  BookOpen,
  Brain
} from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

interface Question {
  id: string;
  type: string;
  content: string;
  text?: string;
  options: { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
  correctOption?: string;
  explanation: string;
  difficulty?: string;
}

interface PracticeQuiz {
  title: string;
  description: string;
  questions: Question[];
}

const TOPICS = [
  { subject: 'Mathematics', topics: ['Fractions & Decimals', 'Algebra Basics', 'Geometry', 'Measurements', 'Number Patterns'] },
  { subject: 'English', topics: ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing', 'Poetry'] },
  { subject: 'Science', topics: ['Life Processes', 'Matter & Energy', 'Earth & Space', 'Health & Nutrition', 'Plants & Animals'] },
  { subject: 'Social Studies', topics: ['History', 'Geography', 'Civic Education', 'Economics', 'Citizenship'] },
];

export default function PracticePage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [quiz, setQuiz] = useState<PracticeQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [error, setError] = useState('');

  const grade = user?.grade || 4;

  useEffect(() => {
    if (TOPICS.length > 0 && !selectedSubject) {
      setSelectedSubject(TOPICS[0].subject);
      setSelectedTopic(TOPICS[0].topics[0]);
    }
  }, []);

  const generateQuiz = async () => {
    if (!selectedSubject || !selectedTopic) return;
    
    setGenerating(true);
    setError('');
    
    try {
      const response = await api.post('/practice/generate-ai-quiz', {
        topic: selectedTopic,
        subject: selectedSubject,
        grade,
        questionCount: 5,
        difficulty: 'medium',
      });

      if (response.data.success && response.data.quiz?.questions?.length > 0) {
        setQuiz(response.data.quiz);
      } else {
        setError('Unable to generate quiz. Please try again.');
      }
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubject && selectedTopic) {
      setLoading(true);
      generateQuiz();
    }
  }, [selectedSubject, selectedTopic]);

  const question = quiz?.questions?.[currentQuestionIndex];

  const handleSelectOption = (optionId: string) => {
    if (isSubmitted) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption || !question) return;
    
    const correctAnswer = question.correctOption || question.correctAnswer;
    setIsSubmitted(true);
    if (selectedOption === correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < (quiz.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setIsSessionComplete(true);
    }
  };

  const handleTopicChange = (subject: string, topic: string) => {
    setSelectedSubject(subject);
    setSelectedTopic(topic);
    setQuiz(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsSessionComplete(false);
    setIsSubmitted(false);
  };

  if (!user) return null;

  if (loading || generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <Sparkles className="w-6 h-6 text-amber-500 absolute top-0 right-0 animate-pulse" />
        </div>
        <h3 className="mt-6 text-xl font-bold text-slate-900">Generating Your Quiz</h3>
        <p className="mt-2 text-slate-600">AI is crafting personalized questions for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Oops!</h3>
        <p className="mt-2 text-slate-600">{error}</p>
        <button 
          onClick={generateQuiz}
          className="mt-6 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!quiz || !question) return null;

  if (isSessionComplete) {
    const percentage = Math.round((score / (quiz.questions?.length || 1)) * 100);
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto mt-8 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-center p-12"
      >
        <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Practice Complete!</h2>
        <p className="text-slate-600 mb-8 text-lg">You've successfully finished this adaptive practice session.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="text-4xl font-black text-indigo-600 mb-1">{percentage}%</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Accuracy</div>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="text-4xl font-black text-green-600 mb-1">+{score * 15}</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">XP Earned</div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link 
            href="/dashboard"
            className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Back to Dashboard
          </Link>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200"
          >
            Practice Next Topic
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Session Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <select 
              value={selectedSubject}
              onChange={(e) => {
                const subject = e.target.value;
                const subjectTopics = TOPICS.find(t => t.subject === subject);
                setSelectedSubject(subject);
                setSelectedTopic(subjectTopics?.topics[0] || '');
                setQuiz(null);
                setCurrentQuestionIndex(0);
                setScore(0);
                setIsSessionComplete(false);
              }}
              className="bg-white border border-slate-200 text-slate-900 font-semibold rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {TOPICS.map(t => (
                <option key={t.subject} value={t.subject}>{t.subject}</option>
              ))}
            </select>
            <select 
              value={selectedTopic}
              onChange={(e) => handleTopicChange(selectedSubject, e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 font-semibold rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {TOPICS.find(t => t.subject === selectedSubject)?.topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
            <Brain className="w-4 h-4 text-indigo-500" />
            <span>AI Powered</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full text-sm">
            Question {currentQuestionIndex + 1} of {quiz?.questions?.length || 0}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-indigo-600 h-full transition-all duration-500 ease-out"
          style={{ width: `${((currentQuestionIndex) / (quiz?.questions?.length || 1)) * 100}%` }}
        />
      </div>

      {/* Assessment Interface container */}
      {question && (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Question Area */}
        <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/50">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 uppercase tracking-wider mb-6">
            <Zap className="w-4 h-4 fill-indigo-600" /> Current Question
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
            {question.content || question.text}
          </h2>
        </div>

        {/* Options Area */}
        <div className="p-8 md:p-12">
          <div className="space-y-4">
            <AnimatePresence>
              {question.options.map((option) => {
                const isSelected = selectedOption === option.id;
                const correctAnswer = question.correctOption || question.correctAnswer;
                const isCorrect = isSubmitted && option.id === correctAnswer;
                const isWrong = isSubmitted && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    whileHover={{ scale: isSubmitted ? 1 : 1.01 }}
                    whileTap={{ scale: isSubmitted ? 1 : 0.99 }}
                    className={clsx(
                      "w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group",
                      !isSubmitted && !isSelected && "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700",
                      !isSubmitted && isSelected && "border-indigo-600 bg-indigo-50 text-indigo-900",
                      isCorrect && "border-green-500 bg-green-50 text-green-900",
                      isWrong && "border-red-500 bg-red-50 text-red-900",
                      isSubmitted && !isCorrect && !isWrong && "border-slate-100 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors",
                        !isSubmitted && !isSelected && "border-slate-300 text-slate-500 group-hover:border-indigo-400 group-hover:text-indigo-600",
                        !isSubmitted && isSelected && "border-indigo-600 bg-indigo-600 text-white",
                        isCorrect && "border-green-500 bg-green-500 text-white",
                        isWrong && "border-red-500 bg-red-500 text-white",
                        isSubmitted && !isCorrect && !isWrong && "border-slate-300 text-slate-400"
                      )}>
                        {option.id.toUpperCase()}
                      </div>
                      <span className="font-semibold text-lg">{option.text}</span>
                    </div>

                    {isCorrect && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                    {isWrong && <XCircle className="w-6 h-6 text-red-500" />}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Explanation Area */}
          <AnimatePresence>
            {isSubmitted && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                className={clsx(
                  "rounded-2xl p-6 flex gap-4",
                  selectedOption === question.correctOption 
                    ? "bg-green-50 border border-green-100" 
                    : "bg-amber-50 border border-amber-100"
                )}
              >
                <div className="shrink-0 mt-1">
                  {selectedOption === question.correctOption 
                    ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                    : <HelpCircle className="w-6 h-6 text-amber-600" />
                  }
                </div>
                <div>
                  <h4 className={clsx(
                    "font-bold mb-2",
                    selectedOption === question.correctOption ? "text-green-900" : "text-amber-900"
                  )}>
                    {selectedOption === question.correctOption ? "Excellent Work!" : "Not quite right. Let's review."}
                  </h4>
                  <p className={clsx(
                    "leading-relaxed",
                    selectedOption === question.correctOption ? "text-green-800" : "text-amber-800"
                  )}>
                    {question.explanation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Bar */}
          <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
            {!isSubmitted ? (
              <button 
                onClick={handleSubmit}
                disabled={!selectedOption}
                className={clsx(
                  "px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2",
                  selectedOption 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                Check Answer
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95"
              >
                {currentQuestionIndex < (quiz.questions?.length || 0) - 1 ? 'Next Question' : 'Finish Practice'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

        </div>
      </div>
      )}
    </div>
  );
}
