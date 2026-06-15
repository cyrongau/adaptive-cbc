'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, BookOpen, Video, Users, GraduationCap, ArrowRight,
  ChevronRight, PlayCircle, Sparkles, MapPin, Target, Monitor, LogIn, Copy, Check, ExternalLink, X,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: number;
  stream?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isLive: boolean;
  meetingLink?: string;
  recordingUrl?: string;
  status: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface TimetableDay {
  day: string;
  lessons: Lesson[];
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

export default function CourseHubPage() {
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [timetable, setTimetable] = useState<TimetableDay[]>([]);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [liveClasses, setLiveClasses] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>('');
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const isTeacher = user?.role === 'teacher';
  const isTutor = user?.role === 'tutor';
  const isStudent = user?.role === 'student';
  const isCandidate = user?.role === 'student' && (Number(user?.grade) === 6 || Number(user?.grade) === 9);
  const theme = getTheme(user?.role || 'student', isCandidate);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchHubData();
      if (isTeacher || isTutor) fetchMyCourses();
      if (isStudent) fetchEnrollments();
    }
  }, [isMounted]);

  const fetchHubData = async () => {
    setLoading(true);
    try {
      const [timetableRes, nextRes, liveRes] = await Promise.all([
        api.get('/lessons/timetable'),
        api.get('/lessons/next'),
        api.get('/lessons/live'),
      ]);

      setTimetable(timetableRes.data?.timetable || []);
      setNextLesson(nextRes.data || null);
      setLiveClasses(liveRes.data || []);
    } catch (err) {
      console.error('Failed to fetch course hub data:', err);
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await api.get('/courses/my-courses');
      setMyCourses(res.data || []);
    } catch {
      setMyCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchEnrollments = async () => {
    setLoadingEnrollments(true);
    try {
      const res = await api.get('/classes/my-enrollments');
      setMyEnrollments(res.data || []);
    } catch {
      setMyEnrollments([]);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      await api.post('/classes/join', { code: joinCode.trim().toUpperCase() });
      setShowJoinModal(false);
      setJoinCode('');
      fetchEnrollments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  const today = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDay = dayNames[today.getDay()];

  useEffect(() => {
    if (timetable.length > 0) {
      setActiveDay(todayDay);
    }
  }, [timetable]);

  const getTimeUntilNext = (lesson: Lesson) => {
    const now = new Date();
    const [hours, minutes] = lesson.startTime.split(':').map(Number);
    const lessonTime = new Date();
    lessonTime.setHours(hours, minutes, 0, 0);

    const diff = lessonTime.getTime() - now.getTime();
    if (diff <= 0) return 'Starting soon';

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Course Hub</h1>
          <p className={`${theme.mutedText} mt-1`}>
            {isTeacher || isTutor
              ? 'Your teaching schedule, classes, and course management'
              : 'Your central place for timetable, live classes, and lessons'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isStudent && (
            <button
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-all"
            >
              <LogIn className="w-4 h-4" />
              Join Class
            </button>
          )}
          <Link
            href={isTeacher || isTutor ? '/my-courses' : '/courses'}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#47a263] text-white font-semibold text-sm rounded-xl hover:bg-[#3d8b55] transition-all"
          >
            <BookOpen className="w-4 h-4" />
            {isTeacher || isTutor ? 'My Courses' : 'Browse Courses'}
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(isTeacher || isTutor ? [
          { label: 'My Courses', value: myCourses.length || '—', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Lessons', value: timetable.reduce((sum, d) => sum + d.lessons.length, 0), icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Live Sessions', value: liveClasses.filter(l => l.status === 'ongoing' || l.startTime <= today.toTimeString().slice(0, 5)).length, icon: Video, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Students', value: '—', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        ] : [
          { label: 'Total Lessons', value: timetable.reduce((sum, d) => sum + d.lessons.length, 0), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Today\'s Lessons', value: timetable.find(d => d.day === todayDay)?.lessons.length || 0, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Live Sessions', value: liveClasses.filter(l => l.status === 'ongoing' || l.startTime <= today.toTimeString().slice(0, 5)).length, icon: Video, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Enrolled Courses', value: myEnrollments.length || '—', icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50' },
        ]).map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${theme.cardBg} rounded-xl p-5 border ${theme.cardBorder} shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className={`text-sm ${theme.mutedText} mt-1`}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Teacher: My Courses Overview */}
      {(isTeacher || isTutor) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm`}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
              <p className={`text-sm ${theme.mutedText} mt-1`}>Courses you are teaching</p>
            </div>
            <Link href="/my-courses" className="flex items-center gap-1 text-sm font-semibold text-[#47a263] hover:underline">
              Manage All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {loadingCourses ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-[#47a263]/30 border-t-[#47a263] rounded-full animate-spin" />
              </div>
            ) : myCourses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No courses yet</p>
                <p className="text-xs text-slate-300 mt-1">Create your first course to get started</p>
                <Link href="/my-courses" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#47a263] text-white font-semibold text-sm rounded-xl hover:bg-[#3d8b55] transition-all">
                  Create Course <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCourses.slice(0, 6).map((course: any) => (
                  <Link
                    key={course.id}
                    href={`/my-courses/${course.id}`}
                    className="group block p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#47a263]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#47a263]/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-[#47a263]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#47a263] transition-colors">
                          {course.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 capitalize">
                          {course.status === 'published' ? '✅ Published' : course.status === 'archived' ? '📦 Archived' : '📝 Draft'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{course.totalModules ?? 0} modules</span>
                      <span>{course.totalLessons ?? 0} lessons</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Lesson + Live Classes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Next Lesson Widget */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm overflow-hidden`}
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Next Lesson</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-[#47a263]/30 border-t-[#47a263] rounded-full animate-spin" />
              </div>
            ) : nextLesson ? (
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{nextLesson.title}</p>
                    <p className="text-sm text-slate-500">{nextLesson.subject} • Grade {nextLesson.grade}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="capitalize">{DAY_LABELS[nextLesson.dayOfWeek] || nextLesson.dayOfWeek}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{nextLesson.startTime} — {nextLesson.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Target className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-green-600">{getTimeUntilNext(nextLesson)}</span>
                  </div>
                </div>
                {nextLesson.meetingLink && (
                  <a
                    href={nextLesson.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 block w-full text-center px-4 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Monitor className="w-4 h-4 inline mr-1.5" />
                    Join Live Class
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-12 px-5">
                <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No upcoming lessons</p>
                <p className="text-xs text-slate-300 mt-1">Your timetable is clear</p>
              </div>
            )}
          </motion.div>

          {/* My Enrolled Classes */}
          {isStudent && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 }}
              className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm`}
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">My Classes</h2>
                {myEnrollments.length > 0 && (
                  <span className="text-xs text-slate-400">{myEnrollments.length} enrolled</span>
                )}
              </div>
              {loadingEnrollments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-3 border-[#47a263]/30 border-t-[#47a263] rounded-full animate-spin" />
                </div>
              ) : myEnrollments.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {myEnrollments.slice(0, 5).map((enr: any) => {
                    const cls = enr.class;
                    const dayText = cls?.schedule ? (() => { try {
                      const slots = JSON.parse(cls.schedule);
                      return slots.map((s: any) => `${s.day} ${s.startTime}`).join(', ');
                    } catch { return ''; } })() : '';
                    return (
                      <div key={enr.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{cls?.name || 'Unknown Class'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{cls?.subject} • Grade {cls?.grade}{cls?.stream ? ` • ${cls.stream}` : ''}</p>
                            {dayText && <p className="text-xs text-slate-400 mt-1">{dayText}</p>}
                            {cls?.teacher && (
                              <p className="text-xs text-slate-400 mt-0.5">Teacher: {cls.teacher.firstName} {cls.teacher.lastName}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-400">No classes yet</p>
                  <p className="text-xs text-slate-300 mt-1">Ask your teacher for a class code</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Live Classes Widget */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm`}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Live Classes</h2>
              {liveClasses.length > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-[#47a263]/30 border-t-[#47a263] rounded-full animate-spin" />
              </div>
            ) : liveClasses.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {liveClasses.slice(0, 4).map((lesson) => (
                  <div key={lesson.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        lesson.status === 'ongoing' ? 'bg-red-50' : 'bg-slate-50'
                      }`}>
                        <Video className={`w-5 h-5 ${lesson.status === 'ongoing' ? 'text-red-500' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{lesson.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{lesson.subject} • {lesson.startTime}</p>
                        {lesson.meetingLink && (
                          <a
                            href={lesson.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Join Now
                          </a>
                        )}
                      </div>
                      {lesson.status === 'ongoing' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">LIVE</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No live classes today</p>
                <p className="text-xs text-slate-300 mt-1">Check back later</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Timetable */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm`}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Weekly Timetable</h2>
                <p className={`text-sm ${theme.mutedText} mt-1`}>Your class schedule for the week</p>
              </div>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-[#47a263]/30 border-t-[#47a263] rounded-full animate-spin" />
                </div>
              ) : timetable.length === 0 ? (
                <div className="text-center py-20">
                  <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-base font-semibold text-slate-400">No timetable available</p>
                  <p className="text-sm text-slate-300 mt-1">Lessons will appear here once scheduled</p>
                </div>
              ) : (
                <div>
                  {/* Day Tabs */}
                  <div className="flex gap-1 overflow-x-auto pb-4 mb-4 border-b border-slate-100">
                    {timetable.map((day) => {
                      const isToday = day.day === todayDay;
                      const isActive = day.day === activeDay;
                      const hasLessons = day.lessons.length > 0;
                      return (
                        <button
                          key={day.day}
                          onClick={() => setActiveDay(day.day)}
                          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                            isActive
                              ? 'bg-[#47a263] text-white shadow-sm'
                              : isToday
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <span className="whitespace-nowrap">{DAY_LABELS[day.day]?.slice(0, 3) || day.day.slice(0, 3)}</span>
                          {hasLessons && (
                            <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                              {day.lessons.length} cls
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Day's Lessons */}
                  <div className="space-y-3">
                    {timetable
                      .find(d => d.day === activeDay)
                      ?.lessons.map((lesson, idx) => (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => setSelectedLesson(lesson)}
                          className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 hover:border-slate-200 cursor-pointer"
                        >
                          <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-lg font-bold text-slate-900 leading-tight">
                              {lesson.startTime}
                            </span>
                            <span className="text-xs text-slate-400">—</span>
                            <span className="text-xs text-slate-500">{lesson.endTime}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-slate-900">{lesson.title}</p>
                                <p className="text-sm text-slate-500 mt-0.5">{lesson.subject} • Grade {lesson.grade}{lesson.stream ? ` • ${lesson.stream}` : ''}</p>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                {lesson.isLive && lesson.meetingLink && (
                                  <a
                                    href={lesson.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                                  >
                                    <Video className="w-3.5 h-3.5" /> Join
                                  </a>
                                )}
                              </div>
                            </div>
                            {lesson.teacher && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-6 h-6 rounded-full bg-[#47a263]/10 flex items-center justify-center text-[10px] font-bold text-[#47a263]">
                                  {lesson.teacher.firstName[0]}{lesson.teacher.lastName[0]}
                                </div>
                                <span className="text-xs text-slate-500">
                                  {lesson.teacher.firstName} {lesson.teacher.lastName}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}

                    {(!timetable.find(d => d.day === activeDay)?.lessons.length) && (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No lessons scheduled</p>
                        <p className="text-xs text-slate-300 mt-1">This day is free</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Lesson Detail Modal */}
      <AnimatePresence>
        {selectedLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedLesson(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {selectedLesson.isLive && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse">LIVE</span>
                  )}
                  <span className="text-xs font-medium text-slate-400 uppercase">{selectedLesson.subject}</span>
                </div>
                <button onClick={() => setSelectedLesson(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedLesson.title}</h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="capitalize">{DAY_LABELS[selectedLesson.dayOfWeek] || selectedLesson.dayOfWeek}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{selectedLesson.startTime} - {selectedLesson.endTime}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span>Grade {selectedLesson.grade}{selectedLesson.stream ? ` • ${selectedLesson.stream}` : ''}</span>
                </div>
                {selectedLesson.description && (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{selectedLesson.description}</p>
                )}
                {selectedLesson.teacher && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-[#47a263]/10 flex items-center justify-center text-xs font-bold text-[#47a263]">
                      {selectedLesson.teacher.firstName[0]}{selectedLesson.teacher.lastName[0]}
                    </div>
                    <span>{selectedLesson.teacher.firstName} {selectedLesson.teacher.lastName}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                >
                  Close
                </button>
                {selectedLesson.meetingLink && (
                  <a
                    href={selectedLesson.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 text-center flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" /> Join Class
                  </a>
                )}
                {selectedLesson.recordingUrl && (
                  <a
                    href={selectedLesson.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 text-center flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" /> Recording
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Join a Class</h2>
            <p className="text-sm text-slate-500 mb-4">Enter the class code provided by your teacher to enroll.</p>
            <form onSubmit={handleJoinClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center text-lg font-bold tracking-widest uppercase"
                  placeholder="MATH101"
                  maxLength={20}
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowJoinModal(false); setJoinCode(''); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                  disabled={joining}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {joining ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Joining...</>
                  ) : (
                    <><LogIn className="w-4 h-4" /> Join Class</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
