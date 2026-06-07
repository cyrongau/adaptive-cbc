'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  MessageSquare, 
  Send, 
  HelpCircle, 
  GraduationCap, 
  Mail, 
  Phone, 
  BookOpen, 
  Layers, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  ArrowRight,
  MessageCircle
} from 'lucide-react';

interface TeacherUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface SchoolTeacher {
  id: string;
  teacherId: string;
  teacher: TeacherUser;
  subjects?: string[];
  streams?: string[];
}

interface TeacherQa {
  id: string;
  studentId: string;
  student?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  teacherId: string;
  teacher?: TeacherUser;
  question: string;
  answer?: string;
  status: 'pending' | 'answered';
  createdAt: string;
}

export default function TeachersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  // State for Student View
  const [teachers, setTeachers] = useState<SchoolTeacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<SchoolTeacher | null>(null);
  const [questionText, setQuestionText] = useState<string>('');
  const [submittingQuestion, setSubmittingQuestion] = useState<boolean>(false);
  const [teacherQas, setTeacherQas] = useState<TeacherQa[]>([]);
  const [loadingQas, setLoadingQas] = useState<boolean>(false);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(true);

  // State for Teacher View
  const [pendingQas, setPendingQas] = useState<TeacherQa[]>([]);
  const [loadingPendingQas, setLoadingPendingQas] = useState<boolean>(true);
  const [answeringQaId, setAnsweringQaId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<string>('');
  const [submittingAnswer, setSubmittingAnswer] = useState<boolean>(false);

  useEffect(() => {
    if (isStudent) {
      fetchStudentTeachers();
    } else if (isTeacher) {
      fetchTeacherQas();
    }
  }, [user]);

  // Fetch Q&As for selected teacher (Student view)
  useEffect(() => {
    if (selectedTeacher) {
      fetchQasForTeacher(selectedTeacher.teacherId);
    }
  }, [selectedTeacher]);

  const fetchStudentTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/institutions/my-school');
      if (res.data && res.data.teachers) {
        setTeachers(res.data.teachers);
        if (res.data.teachers.length > 0) {
          setSelectedTeacher(res.data.teachers[0]);
        }
        setIsEnrolled(true);
      } else {
        setIsEnrolled(false);
      }
    } catch (error) {
      console.error('Failed to fetch school/teachers info', error);
      setIsEnrolled(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchQasForTeacher = async (teacherId: string) => {
    setLoadingQas(true);
    try {
      const res = await api.get(`/institutions/qa/teacher/${teacherId}`);
      setTeacherQas(res.data || []);
    } catch (error) {
      console.error('Failed to load Q&As', error);
    } finally {
      setLoadingQas(false);
    }
  };

  const fetchTeacherQas = async () => {
    if (!user) return;
    setLoadingPendingQas(true);
    try {
      const res = await api.get(`/institutions/qa/teacher/${user.id}`);
      setPendingQas(res.data || []);
    } catch (error) {
      console.error('Failed to load teacher Q&As', error);
    } finally {
      setLoadingPendingQas(false);
    }
  };

  const handleCreateDM = async (teacherId: string) => {
    try {
      const res = await api.post('/chat/conversations', {
        type: 'teacher_student',
        participantIds: [teacherId],
      });
      toast.success('Conversation initiated!');
      router.push(`/chat?conversationId=${res.data.id}`);
    } catch (error: any) {
      console.error('Failed to start direct chat', error);
      toast.error(error.response?.data?.message || 'Could not initiate chat.');
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !questionText.trim()) return;

    setSubmittingQuestion(true);
    try {
      await api.post('/institutions/qa', {
        teacherId: selectedTeacher.teacherId,
        question: questionText,
      });
      toast.success('Question submitted successfully!');
      setQuestionText('');
      fetchQasForTeacher(selectedTeacher.teacherId);
    } catch (error: any) {
      console.error('Failed to submit question', error);
      toast.error(error.response?.data?.message || 'Failed to submit question.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (qaId: string) => {
    if (!answerText.trim()) return;

    setSubmittingAnswer(true);
    try {
      await api.post(`/institutions/qa/${qaId}/answer`, {
        answer: answerText,
      });
      toast.success('Answer posted successfully!');
      setAnswerText('');
      setAnsweringQaId(null);
      fetchTeacherQas();
    } catch (error: any) {
      console.error('Failed to submit answer', error);
      toast.error(error.response?.data?.message || 'Failed to post answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const fullName = `${t.teacher?.firstName || ''} ${t.teacher?.lastName || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesName = fullName.includes(query);
    const matchesSubject = t.subjects?.some(s => s.toLowerCase().includes(query)) || false;
    return matchesName || matchesSubject;
  });

  if (loading && isStudent) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Student view with no enrollment
  if (isStudent && !isEnrolled) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-2xl mx-auto my-8">
        <HelpCircle className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Active School Registration</h3>
        <p className="text-slate-500 mb-6">
          To connect with teachers, ask questions, and utilize the Q&A features, you need to first join a school.
        </p>
        <button
          onClick={() => router.push('/school')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-md"
        >
          Go to My School
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
          <Users className="w-8 h-8 text-indigo-600" />
          {isStudent ? 'My Teachers' : 'Student Q&A Desk'}
        </h1>
        <p className="text-slate-500 mt-1">
          {isStudent 
            ? 'Access teacher profiles, send messages, and engage in academic Q&As.' 
            : 'Respond to questions submitted by students in your classes.'}
        </p>
      </div>

      {/* --- STUDENT VIEW --- */}
      {isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Search & Teachers List */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
            {/* Search area */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((t) => {
                  const isSelected = selectedTeacher?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeacher(t)}
                      className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${
                        isSelected ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                        {t.teacher?.firstName?.[0]}{t.teacher?.lastName?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {t.teacher?.firstName} {t.teacher?.lastName}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {t.subjects?.join(', ') || 'Teacher'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No teachers found matching your search.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Teacher Profile details & Q&A */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTeacher ? (
              <>
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative"></div>
                  <div className="p-6 pt-0 relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="flex items-end gap-4 -mt-10">
                      <div className="w-20 h-20 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center text-2xl font-extrabold text-indigo-700 shadow-md">
                        {selectedTeacher.teacher?.firstName?.[0]}{selectedTeacher.teacher?.lastName?.[0]}
                      </div>
                      <div className="mb-2">
                        <h2 className="text-xl font-bold text-slate-900">
                          {selectedTeacher.teacher?.firstName} {selectedTeacher.teacher?.lastName}
                        </h2>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full mt-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          Faculty Member
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCreateDM(selectedTeacher.teacherId)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm shrink-0 self-start md:self-auto"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      Direct Message
                    </button>
                  </div>

                  <div className="border-t border-slate-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/40">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{selectedTeacher.teacher?.email}</span>
                      </div>
                      {selectedTeacher.teacher?.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{selectedTeacher.teacher?.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <BookOpen className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-700">Subjects</p>
                          <p className="text-xs">{selectedTeacher.subjects?.join(', ') || 'No subjects assigned'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <Layers className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-700">Streams/Classes</p>
                          <p className="text-xs">{selectedTeacher.streams?.join(', ') || 'No streams assigned'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Q&A Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-indigo-600" />
                      Interactive Q&A Board
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ask your teacher an academic question or review existing class inquiries.
                    </p>
                  </div>

                  {/* Ask Question Form */}
                  <form onSubmit={handleAskQuestion} className="space-y-3">
                    <textarea
                      placeholder="Ask a question about assignments, subjects, or concepts..."
                      rows={3}
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    ></textarea>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingQuestion || !questionText.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        {submittingQuestion ? 'Submitting...' : 'Post Question'}
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>

                  {/* Question Board list */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800">Board Discussions</h4>

                    {loadingQas ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : teacherQas.length > 0 ? (
                      <div className="space-y-4">
                        {teacherQas.map((qa) => (
                          <div key={qa.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                                  {qa.student?.firstName?.[0] || 'S'}{qa.student?.lastName?.[0] || ''}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">
                                    {qa.student?.firstName} {qa.student?.lastName}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {new Date(qa.createdAt).toLocaleDateString('en-US', {
                                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                qa.status === 'answered' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {qa.status === 'answered' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    Answered
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                                    Pending Response
                                  </>
                                )}
                              </span>
                            </div>

                            <p className="text-sm text-slate-700 font-medium pl-1">
                              {qa.question}
                            </p>

                            {qa.answer && (
                              <div className="mt-2 pl-4 py-2 border-l-2 border-indigo-500 bg-indigo-50/30 rounded-r-lg space-y-1">
                                <p className="text-[10px] font-bold text-indigo-800">Teacher Response</p>
                                <p className="text-sm text-slate-600">{qa.answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                        No questions asked yet. Be the first to start the discussion!
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full bg-white rounded-2xl border border-slate-200 flex items-center justify-center p-12 text-center">
                <div className="max-w-xs space-y-2">
                  <Users className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-bold text-slate-900">Select a Teacher</h3>
                  <p className="text-xs text-slate-500">Choose a teacher from the list to view profile, engage in conversations or submit Q&As.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TEACHER VIEW --- */}
      {isTeacher && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
              Incoming Student Questions
            </h3>
            <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingQas.filter(q => q.status === 'pending').length} Action Required
            </span>
          </div>

          {loadingPendingQas ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : pendingQas.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {pendingQas.map((qa) => (
                <div key={qa.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-2">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {qa.student?.firstName?.[0] || 'S'}{qa.student?.lastName?.[0] || ''}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {qa.student?.firstName} {qa.student?.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(qa.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      qa.status === 'answered' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {qa.status === 'answered' ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Answered
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                          Pending Action
                        </>
                      )}
                    </span>
                  </div>

                  <div className="pl-1">
                    <p className="text-sm text-slate-700 font-semibold bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                      {qa.question}
                    </p>
                  </div>

                  {qa.status === 'pending' ? (
                    answeringQaId === qa.id ? (
                      <div className="space-y-3 pl-1">
                        <textarea
                          placeholder="Type your explanation or response..."
                          rows={3}
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        ></textarea>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setAnsweringQaId(null);
                              setAnswerText('');
                            }}
                            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSubmitAnswer(qa.id)}
                            disabled={submittingAnswer || !answerText.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            {submittingAnswer ? 'Posting...' : 'Submit Answer'}
                            <Send className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pl-1">
                        <button
                          onClick={() => {
                            setAnsweringQaId(qa.id);
                            setAnswerText('');
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
                        >
                          Answer Question
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="pl-1 py-2 border-l-2 border-green-500 bg-green-50/20 rounded-r-lg space-y-1">
                      <p className="text-[10px] font-bold text-green-800">Your Answer</p>
                      <p className="text-sm text-slate-600">{qa.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400">
              <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No pending student questions to answer.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
