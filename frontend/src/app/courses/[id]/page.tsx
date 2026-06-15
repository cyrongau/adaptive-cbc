'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import {
  ArrowLeft, Star, Clock, Users, BookOpen, Play, CheckCircle, Lock,
  ChevronDown, ChevronUp, Award, Share2, Heart, FileText, Headphones,
  Video, Download, Loader2, CheckCircle2, XCircle, ShoppingCart, X, HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import HtmlContent, { stripHtml } from '@/components/ui/HtmlContent';

export default function CourseDetailsPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({ 0: true });
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState<Record<number, any>>({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState({ earned: 0, total: 0 });
  const [questionResults, setQuestionResults] = useState<Record<number, boolean>>({});
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [storeProductId, setStoreProductId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const promises = [
          api.get(`/courses/${params.id}`),
          api.get(`/courses/${params.id}/reviews`),
          api.get(`/courses/${params.id}/resources`),
        ];

        if (user) {
          promises.push(api.get(`/courses/${params.id}/assessment/attempts`));
          promises.push(api.get(`/enrollment/my-enrollments/${params.id}`));
        }

        const [courseRes, reviewsRes, resourcesRes, attemptsRes, enrollRes] = await Promise.allSettled(promises);

        if (courseRes.status === 'fulfilled') {
          const courseData = courseRes.value.data;
          setCourse(courseData);

          try {
            const qRes = await api.get(`/courses/${params.id}/questions`);
            setQuestions(qRes.data || []);
          } catch {}

          if (Number(courseData.price) > 0) {
            try {
              const productRes = await api.get(`/store/by-course/${params.id}`);
              if (productRes.data) {
                setStoreProductId(productRes.data.id);
              }
            } catch {}
          }
        }
        if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value.data || []);
        if (resourcesRes.status === 'fulfilled') setResources(resourcesRes.value.data || []);
        if (attemptsRes && attemptsRes.status === 'fulfilled') {
          const data = attemptsRes.value.data || [];
          setAttempts(data);
          if (data.length > 0) {
            setAssessmentScore({ earned: data[0].score, total: data[0].totalMarks });
            setAssessmentSubmitted(true);
          }
        }
        if (enrollRes && enrollRes.status === 'fulfilled' && enrollRes.value.data) {
          setIsEnrolled(true);
        }
      } catch {
        toast.error('Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const toggleModule = (index: number) => {
    setOpenModules(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const totalLessons = course?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const freeLessons = course?.modules?.reduce(
    (acc: number, m: any) => acc + (m.lessons?.filter((l: any) => l.isPreview).length || 0), 0
  ) || 0;

  const handleEnroll = async () => {
    if (!user) { toast.error('Please log in to enroll'); return; }
    if (user.role !== 'student') { toast.error('Only students can enroll'); return; }
    setIsEnrolling(true);
    try {
      await api.post('/enrollment', {
        courseId: params.id,
        courseTitle: course.title,
        amountPaid: course.price,
      });
      setIsEnrolled(true);
      toast.success('Successfully enrolled!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Enrollment failed';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: course?.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      default: return <Play className="w-4 h-4" />;
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getMaterialColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'text-red-500 bg-red-50';
      case 'audio': return 'text-purple-500 bg-purple-50';
      case 'video': return 'text-blue-500 bg-blue-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const handleAnswerChange = (qi: number, value: any) => {
    setStudentAnswers(prev => ({ ...prev, [qi]: value }));
  };

  const handleSubmitAssessment = () => {
    const questions = course.assessmentQuestions;
    if (!questions?.length) return;
    let earned = 0;
    let total = 0;
    const results: Record<number, boolean> = {};

    questions.forEach((q: any, i: number) => {
      const studentAnswer = studentAnswers[i];
      total += q.marks || 0;
      let correct = false;

      switch (q.questionType) {
        case 'multiple_choice':
        case 'true_false':
          correct = studentAnswer === q.correctAnswer;
          break;
        case 'multiple_answer':
          correct = studentAnswer === q.correctAnswer;
          break;
        case 'short_answer':
        case 'fill_in_blank':
          const cleanStudent = stripHtml(studentAnswer || '').trim().toLowerCase();
          const cleanCorrect = stripHtml(q.options?.[0] || '').trim().toLowerCase();
          correct = cleanStudent === cleanCorrect;
          break;
      }

      results[i] = correct;
      if (correct) earned += q.marks || 0;
    });

    setQuestionResults(results);
    setAssessmentScore({ earned, total });
    setAssessmentSubmitted(true);
  };

  const handleSubmitScore = async () => {
    if (!user) { toast.error('Please log in to submit your score'); return; }
    setIsSubmittingScore(true);
    try {
      const answers = Object.entries(studentAnswers).map(([qi, answer]) => ({
        questionIndex: parseInt(qi),
        answer,
      }));
      const res = await api.post(`/courses/${params.id}/assessment/submit`, { answers });
      setAttempts(prev => [res.data, ...prev]);
      toast.success(`Score saved: ${res.data.score} / ${res.data.totalMarks}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit score';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#47a263] animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-400">Course not found</p>
          <Link href="/courses" className="text-[#47a263] font-medium mt-2 inline-block">Browse courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-low">
      <div className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #006a34 0%, #1c8445 50%, #0b5327 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <Link href="/courses" className="inline-flex items-center gap-2 text-white/60 text-sm hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </Link>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full">{course.subject}</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-4">{course.title}</h1>
              {course.description && (
                <p className="text-lg text-white/80 font-semibold mb-6">{course.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {Number(course.averageRating || 0).toFixed(1)} ({course.totalReviews} reviews)
                </span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.totalStudents} students</span>
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {totalLessons} lessons</span>
                {course.estimatedDuration && (
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.estimatedDuration}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {course.whatYouWillLearn?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-extrabold text-slate-900 mb-4">What You'll Learn</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {course.whatYouWillLearn.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-[#47a263] shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-slate-900">Course Curriculum</h2>
                <span className="text-sm text-slate-500">{course.modules?.length || 0} modules &bull; {totalLessons} lessons</span>
              </div>
              {(!course.modules || course.modules.length === 0) ? (
                <p className="text-sm text-slate-400 text-center py-8">No modules published yet.</p>
              ) : (
                <div className="space-y-3">
                  {(course.modules || []).sort((a: any, b: any) => a.order - b.order).map((mod: any, moduleIndex: number) => (
                    <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button onClick={() => toggleModule(moduleIndex)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-[#006a34]/10 text-[#006a34] font-bold text-sm flex items-center justify-center">{moduleIndex + 1}</span>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-slate-900">{mod.title}</p>
                            <p className="text-xs text-slate-500">{mod.lessons?.length || 0} lessons</p>
                          </div>
                        </div>
                        {openModules[moduleIndex] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </button>
                      {openModules[moduleIndex] && (
                        <div className="divide-y divide-slate-100">
                          {(mod.learningOutcomes || mod.coreMaterialContent || mod.practicalLearningActivities) && (
                            <div className="p-4 bg-slate-50/50 space-y-3 border-b border-slate-100">
                              {mod.learningOutcomes && (
                                <div>
                                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Learning Outcomes</h4>
                                  <div className="text-sm text-slate-700"><HtmlContent html={mod.learningOutcomes} renderMath /></div>
                                </div>
                              )}
                              {mod.coreMaterialContent && (
                                <div>
                                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Core Content</h4>
                                  <div className="text-sm text-slate-700"><HtmlContent html={mod.coreMaterialContent} renderMath /></div>
                                </div>
                              )}
                              {mod.practicalLearningActivities && (
                                <div>
                                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Practical Activities</h4>
                                  <div className="text-sm text-slate-700"><HtmlContent html={mod.practicalLearningActivities} renderMath /></div>
                                </div>
                              )}
                            </div>
                          )}
                          {(mod.lessons || []).sort((a: any, b: any) => a.order - b.order).map((lesson: any, lessonIndex: number) => {
                            const canView = lesson.isPreview || isEnrolled;
                            return (
                              <div key={lesson.id}
                                onClick={() => canView && setSelectedLesson(lesson)}
                                className={`flex items-center justify-between p-4 transition-colors ${
                                  canView ? 'hover:bg-slate-50 cursor-pointer' : ''
                                }`}>
                                <div className="flex items-center gap-3">
                                  {canView ? (
                                    <Play className="w-5 h-5 text-[#47a263]" />
                                  ) : (
                                    <Lock className="w-5 h-5 text-slate-300" />
                                  )}
                                  <div>
                                    <p className={`text-sm ${canView ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{lesson.title}</p>
                                    {lesson.isPreview && <span className="text-[10px] text-[#47a263] font-bold uppercase">Free Preview</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {lesson.duration && <span className="text-xs text-slate-400">{lesson.duration}</span>}
                                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                                    lesson.contentType === 'video' ? 'bg-purple-50 text-purple-500' :
                                    lesson.contentType === 'audio' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'
                                  }`}>
                                    {lesson.contentType === 'video' ? <Video className="w-3.5 h-3.5" /> :
                                     lesson.contentType === 'audio' ? <Headphones className="w-3.5 h-3.5" /> :
                                     <FileText className="w-3.5 h-3.5" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {course.assessmentQuestions?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-extrabold text-slate-900">Course Assessment</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                      Pass: {course.assessmentPassThreshold ?? 50}%
                    </span>
                    <span className="text-sm text-slate-500">{course.assessmentQuestions.length} question{course.assessmentQuestions.length > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {assessmentSubmitted && (
                  <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
                    assessmentScore.earned === assessmentScore.total
                      ? 'bg-green-50 border border-green-200'
                      : assessmentScore.earned >= (course.assessmentPassThreshold ?? 50) / 100 * assessmentScore.total
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                  }`}>
                    <Award className={`w-6 h-6 ${
                      assessmentScore.earned === assessmentScore.total
                        ? 'text-green-500'
                        : assessmentScore.earned >= (course.assessmentPassThreshold ?? 50) / 100 * assessmentScore.total
                          ? 'text-green-500'
                          : 'text-red-400'
                    }`} />
                    <div>
                      <p className="font-bold text-slate-900">Score: {assessmentScore.earned} / {assessmentScore.total}</p>
                      <p className="text-sm text-slate-500">
                        {assessmentScore.earned === assessmentScore.total
                          ? 'Perfect! All answers correct.'
                          : assessmentScore.earned >= (course.assessmentPassThreshold ?? 50) / 100 * assessmentScore.total
                            ? 'You passed! Review your answers below.'
                            : `Needs improvement (pass: ${course.assessmentPassThreshold ?? 50}%). Review incorrect answers below.`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {course.assessmentQuestions.map((q: any, qi: number) => (
                    <div key={qi} className={`p-5 rounded-xl border ${
                      assessmentSubmitted
                        ? questionResults[qi]
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-red-200 bg-red-50/50'
                        : 'border-slate-200 bg-slate-50'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Question {qi + 1} of {course.assessmentQuestions.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{q.marks || 0} mark{q.marks !== 1 ? 's' : ''}</span>
                      </div>

                      <div className="mb-4">
                        <HtmlContent html={q.question} renderMath className="text-sm text-slate-900 font-medium" />
                      </div>

                      {(q.questionType === 'multiple_choice' || q.questionType === 'true_false') && (
                        <div className="space-y-2">
                          {q.options.map((opt: string, oi: number) => (
                            <label key={oi} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              studentAnswers[qi] === oi
                                ? assessmentSubmitted
                                  ? questionResults[qi]
                                    ? 'border-green-400 bg-green-50'
                                    : 'border-red-400 bg-red-50'
                                  : 'border-[#006a34] bg-[#006a34]/5'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}>
                              <input
                                type="radio"
                                name={`q-${qi}`}
                                checked={studentAnswers[qi] === oi}
                                onChange={() => handleAnswerChange(qi, oi)}
                                disabled={assessmentSubmitted}
                                className="accent-[#006a34]"
                              />
                              <HtmlContent html={opt} renderMath className="text-sm text-slate-700" />
                            </label>
                          ))}
                        </div>
                      )}

                      {q.questionType === 'multiple_answer' && (
                        <div className="space-y-2">
                          {q.options.map((opt: string, oi: number) => {
                            const isChecked = !!(studentAnswers[qi] & (1 << oi));
                            return (
                              <label key={oi} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                assessmentSubmitted
                                  ? isChecked
                                    ? questionResults[qi]
                                      ? 'border-green-400 bg-green-50'
                                      : 'border-red-400 bg-red-50'
                                    : 'border-slate-200 bg-white'
                                  : isChecked
                                    ? 'border-[#006a34] bg-[#006a34]/5'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const mask = studentAnswers[qi] || 0;
                                    handleAnswerChange(qi, mask ^ (1 << oi));
                                  }}
                                  disabled={assessmentSubmitted}
                                  className="accent-[#006a34]"
                                />
                                <HtmlContent html={opt} renderMath className="text-sm text-slate-700" />
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {q.questionType === 'short_answer' && (
                        <div>
                          <textarea
                            value={studentAnswers[qi] || ''}
                            onChange={(e) => handleAnswerChange(qi, e.target.value)}
                            disabled={assessmentSubmitted}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-[#006a34] focus:ring-1 focus:ring-[#006a34] outline-none resize-none disabled:bg-slate-50"
                            placeholder="Type your answer here..."
                          />
                          {assessmentSubmitted && (
                            <p className={`mt-2 text-xs font-semibold flex items-center gap-1 ${questionResults[qi] ? 'text-green-600' : 'text-red-500'}`}>
                              {questionResults[qi] ? <><CheckCircle2 className="w-3.5 h-3.5" /> Correct!</> : <><XCircle className="w-3.5 h-3.5" /> Expected: <HtmlContent html={q.options[0]} renderMath className="inline text-xs" /></>}
                            </p>
                          )}
                        </div>
                      )}

                      {q.questionType === 'fill_in_blank' && (
                        <div>
                          <input
                            type="text"
                            value={studentAnswers[qi] || ''}
                            onChange={(e) => handleAnswerChange(qi, e.target.value)}
                            disabled={assessmentSubmitted}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-[#006a34] focus:ring-1 focus:ring-[#006a34] outline-none disabled:bg-slate-50"
                            placeholder="Type your answer..."
                          />
                          {assessmentSubmitted && (
                            <p className={`mt-2 text-xs font-semibold flex items-center gap-1 ${questionResults[qi] ? 'text-green-600' : 'text-red-500'}`}>
                              {questionResults[qi] ? <><CheckCircle2 className="w-3.5 h-3.5" /> Correct!</> : <><XCircle className="w-3.5 h-3.5" /> Expected: <HtmlContent html={q.options[0]} renderMath className="inline text-xs" /></>}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!assessmentSubmitted ? (
                  <div className="mt-6 flex items-center gap-4">
                    <button onClick={handleSubmitAssessment}
                      className="px-6 py-3 bg-[#006a34] text-white font-bold rounded-xl hover:bg-[#005028] transition-all">
                      Check Answers
                    </button>
                    {!isEnrolled && user?.role === 'student' && (
                      <span className="text-xs text-amber-600 font-medium">Enroll in the course to submit your score</span>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 flex gap-3">
                    {isEnrolled ? (
                      <button onClick={handleSubmitScore} disabled={isSubmittingScore}
                        className="px-6 py-3 bg-[#006a34] text-white font-bold rounded-xl hover:bg-[#005028] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSubmittingScore ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Submit Score</>}
                      </button>
                    ) : (
                      <span className="px-6 py-3 text-sm text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-xl">
                        Enroll in the course to submit your score
                      </span>
                    )}
                    <button onClick={() => {
                      setAssessmentSubmitted(false);
                      setStudentAnswers({});
                      setQuestionResults({});
                    }}
                      className="px-6 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
                      Reset & Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {assessmentSubmitted && course.assessmentQuestions && (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl font-extrabold text-slate-900">Practice Recommendations</h2>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Based on your assessment results, here are topics you should practice more:
                </p>
                <div className="flex flex-wrap gap-2">
                  {course.assessmentQuestions.map((q: any, i: number) => {
                    const wrong = assessmentSubmitted && questionResults[i] === false;
                    if (!wrong) return null;
                    const topic = q.question ? stripHtml(q.question).split(' ').slice(0, 4).join(' ') + '...' : `Question ${i + 1}`;
                    return (
                      <Link key={i} href={`/practice?subject=${encodeURIComponent(course.subject || '')}&grade=${course.grade || ''}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors">
                        <Play className="w-3 h-3" /> Practice: {topic}
                      </Link>
                    );
                  })}
                  {(!assessmentSubmitted || course.assessmentQuestions.every((_: any, i: number) => questionResults[i] !== false)) && (
                    <Link href={`/practice?subject=${encodeURIComponent(course.subject || '')}&grade=${course.grade || ''}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors">
                      <Play className="w-3 h-3" /> Adaptive Practice: {course.subject || 'General'}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {attempts.length > 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-extrabold text-slate-900 mb-4">Attempt History</h2>
                <div className="space-y-3">
                  {attempts.map((a: any, i: number) => (
                    <div key={a.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                      i === 0 ? 'border-[#006a34] bg-[#006a34]/5' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                          a.passed ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {a.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Attempt {attempts.length - i}
                            {i === 0 && <span className="ml-2 text-[10px] text-[#006a34] font-bold uppercase">Latest</span>}
                          </p>
                          <p className="text-xs text-slate-500">{new Date(a.submittedAt).toLocaleDateString()} at {new Date(a.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-extrabold ${a.passed ? 'text-green-600' : 'text-slate-500'}`}>
                          {a.score} / {a.totalMarks}
                        </p>
                        <p className={`text-xs font-semibold ${a.passed ? 'text-green-500' : 'text-slate-400'}`}>
                          {a.passed ? 'Passed' : 'Failed'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.teacher && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-extrabold text-slate-900 mb-4">Your Instructor</h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#006a34]/10 flex items-center justify-center text-[#006a34] font-bold text-lg">
                    {course.teacher.firstName?.[0]}{course.teacher.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{course.teacher.firstName} {course.teacher.lastName}</h3>
                    <p className="text-sm text-slate-500 capitalize">{course.teacher.role}</p>
                  </div>
                </div>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-extrabold text-slate-900 mb-4">Student Reviews</h2>
                <div className="space-y-4">
                  {reviews.slice(0, 10).map((review: any) => (
                    <div key={review.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star key={starIndex} className={`w-4 h-4 ${starIndex < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{review.comment}</p>
                      <p className="text-xs font-semibold text-slate-900">
                        {review.student?.firstName} {review.student?.lastName}
                        <span className="text-slate-400 font-normal"> &bull; {new Date(review.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resources.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-extrabold text-slate-900 mb-4">Learning Materials</h2>
                <p className="text-sm text-slate-500 mb-6">Downloadable resources included with this course.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((material: any) => (
                    <a key={material.id} href={material.url} target="_blank"
                      className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-100 transition-all group">
                      <div className={`w-10 h-10 rounded-lg ${getMaterialColor(material.type)} flex items-center justify-center shrink-0`}>
                        {getMaterialIcon(material.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{material.title}</p>
                        <p className="text-xs text-slate-400">{material.type.toUpperCase()}{material.fileSize ? ` \u2022 ${(material.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}</p>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Q&A Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-slate-900">Questions & Answers</h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
              </div>

              {user && user.role === 'student' && (
                <div className="flex gap-2 mb-6">
                  <input
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Ask a question about this course..."
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30 focus:border-[#47a263]"
                  />
                  <button onClick={async () => {
                    if (!questionText.trim()) return;
                    setAskingQuestion(true);
                    try {
                      const res = await api.post(`/courses/${params.id}/questions`, { question: questionText.trim() });
                      setQuestions(prev => [res.data, ...prev]);
                      setQuestionText('');
                      toast.success('Question posted!');
                    } catch {
                      toast.error('Failed to post question');
                    } finally {
                      setAskingQuestion(false);
                    }
                  }} disabled={askingQuestion || !questionText.trim()}
                    className="px-5 py-2.5 bg-[#47a263] text-white font-semibold text-sm rounded-xl hover:bg-[#3d8b55] disabled:opacity-50 transition-all flex items-center gap-2">
                    {askingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Ask</>}
                  </button>
                </div>
              )}

              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No questions yet. Be the first to ask!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q: any) => (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#006a34]/10 flex items-center justify-center text-xs font-bold text-[#006a34] shrink-0">
                          {q.student?.firstName?.[0]}{q.student?.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{q.question}</p>
                          <p className="text-xs text-slate-400 mt-1">{q.student?.firstName} {q.student?.lastName} &bull; {new Date(q.createdAt).toLocaleDateString()}</p>
                          {q.answer && (
                            <div className="mt-3 pl-4 border-l-2 border-[#47a263]">
                              <p className="text-sm text-slate-700">{q.answer}</p>
                              <p className="text-xs text-[#47a263] font-semibold mt-1">
                                {q.teacher?.firstName} {q.teacher?.lastName} (Teacher) &bull; {new Date(q.answeredAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {course.featuredVideo && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="aspect-video relative">
                  <iframe src={course.featuredVideo.replace(/\/watch\?v=/, '/embed/').replace('youtu.be/', 'youtube.com/embed/')} title="Course Preview"
                    className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Preview</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <div className="text-center mb-6">
                <span className="text-3xl font-extrabold text-slate-900">
                  {!course.price || Number(course.price) === 0 ? 'Free' : `KSh ${Number(course.price).toLocaleString()}`}
                </span>
                {Number(course.price) > 0 && <p className="text-xs text-slate-400 mt-1">One-time payment &bull; Lifetime access</p>}
              </div>

              {isEnrolled ? (
                <button onClick={() => document.querySelector('.space-y-3')?.scrollIntoView({ behavior: 'smooth' })}
                  className="block w-full py-3 bg-[#47a263] text-white font-extrabold text-sm rounded-xl text-center hover:bg-[#3d8b55] transition-all duration-300 shadow-sm flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4" /> Continue Learning →
                </button>
              ) : !course.price || Number(course.price) === 0 ? (
                <button onClick={handleEnroll} disabled={isEnrolling}
                  className="block w-full py-3 bg-[#47a263] text-white font-extrabold text-sm rounded-xl text-center hover:bg-[#3d8b55] transition-all duration-300 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isEnrolling ? <><Loader2 className="w-4 h-4 animate-spin" /> Enrolling...</> : <>Enroll Now <motion.span className="inline-block" whileHover={{ x: 4 }}>→</motion.span></>}
                </button>
              ) : storeProductId ? (
                <button onClick={async () => {
                  try {
                    await api.post('/store/cart/add', { productId: storeProductId, quantity: 1 });
                    toast.success('Added to cart!');
                    window.location.href = '/store/checkout';
                  } catch {
                    toast.error('Failed to add to cart');
                  }
                }}
                  className="block w-full py-3 bg-[#006a34] text-white font-extrabold text-sm rounded-xl text-center hover:bg-[#005028] transition-all duration-300 shadow-sm flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Purchase KSh {Number(course.price).toLocaleString()} →
                </button>
              ) : (
                <button disabled
                  className="block w-full py-3 bg-slate-300 text-white font-extrabold text-sm rounded-xl cursor-not-allowed">
                  Purchase options coming soon
                </button>
              )}

              {!user && <p className="text-xs text-center text-slate-400 mt-2"><Link href="/login" className="text-[#47a263] hover:underline">Log in</Link> to enroll</p>}
              {user && user.role !== 'student' && !isEnrolled && <p className="text-xs text-center text-amber-600 mt-2">Only students can enroll</p>}

              <div className="flex gap-3 mt-3">
                <button onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`flex-1 py-2.5 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${isWishlisted ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500' : ''}`} /> Wishlist
                </button>
                <button onClick={handleShare}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
              <div className="space-y-3 mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Lessons</span>
                  <span className="font-semibold text-slate-900">{totalLessons}</span>
                </div>
                {course.estimatedDuration && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Duration</span>
                    <span className="font-semibold text-slate-900">{course.estimatedDuration}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><Play className="w-4 h-4" /> Free Previews</span>
                  <span className="font-semibold text-slate-900">{freeLessons}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><Users className="w-4 h-4" /> Students</span>
                  <span className="font-semibold text-slate-900">{course.totalStudents}</span>
                </div>
                {course.certificateEnabled && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><Award className="w-4 h-4" /> Certificate</span>
                    <span className="font-semibold text-slate-900">Yes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLesson(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-extrabold text-slate-900">{selectedLesson.title}</h2>
              <button onClick={() => setSelectedLesson(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {selectedLesson.learningObjective && (
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2">Learning Objective</h3>
                  <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 prose prose-sm max-w-none">
                    <HtmlContent html={selectedLesson.learningObjective} renderMath />
                  </div>
                </div>
              )}
              {selectedLesson.materials && (
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2">Materials</h3>
                  <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 prose prose-sm max-w-none">
                    <HtmlContent html={selectedLesson.materials} renderMath />
                  </div>
                </div>
              )}
              {selectedLesson.stepByStepDelivery && (
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2">Step-by-Step Delivery</h3>
                  <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 prose prose-sm max-w-none">
                    <HtmlContent html={selectedLesson.stepByStepDelivery} renderMath />
                  </div>
                </div>
              )}
              {selectedLesson.homework && (
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2">Homework</h3>
                  <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 prose prose-sm max-w-none">
                    <HtmlContent html={selectedLesson.homework} renderMath />
                  </div>
                </div>
              )}
              {selectedLesson.videoUrl && (
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2">Video</h3>
                  {selectedLesson.videoUrl.includes('youtube') || selectedLesson.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={selectedLesson.videoUrl.replace(/\/watch\?v=/, '/embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full aspect-video rounded-xl" allowFullScreen
                    />
                  ) : (
                    <video controls className="w-full rounded-xl" src={selectedLesson.videoUrl} />
                  )}
                </div>
              )}
              {selectedLesson.articleBody && (
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2">Lesson Content</h3>
                  <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4">
                    <HtmlContent html={selectedLesson.articleBody} renderMath />
                  </div>
                </div>
              )}
              {selectedLesson.contentUrl && (
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2">Resource</h3>
                  {selectedLesson.contentType === 'video' ? (
                    <video controls className="w-full rounded-xl" src={selectedLesson.contentUrl} />
                  ) : selectedLesson.contentType === 'audio' ? (
                    <audio controls className="w-full" src={selectedLesson.contentUrl} />
                  ) : (
                    <a href={selectedLesson.contentUrl} target="_blank" className="text-[#47a263] font-semibold text-sm hover:underline flex items-center gap-1">
                      Download {selectedLesson.contentType || 'resource'} →
                    </a>
                  )}
                </div>
              )}
              {!selectedLesson.learningObjective && !selectedLesson.materials && !selectedLesson.stepByStepDelivery && !selectedLesson.homework && !selectedLesson.videoUrl && !selectedLesson.articleBody && !selectedLesson.contentUrl && (
                <p className="text-sm text-slate-400 text-center py-8">No content available for this lesson.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
