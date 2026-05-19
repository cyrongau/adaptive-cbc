'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import { getAvatarUrl } from '@/lib/utils';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import {
  BookOpen, Clock, TrendingUp, Award, Target, Calendar, ChevronRight,
  Sparkles, Building2, Users, FileText, GraduationCap, MapPin,
  PlayCircle, BarChart3, ArrowRight, RotateCcw, PenTool,
} from 'lucide-react';
import Image from 'next/image';

interface SchoolInfo {
  institution: {
    id: string;
    name: string;
    code: string;
    type: string;
    county: string;
    motto?: string;
    totalStudents: number;
    totalTeachers: number;
  };
  enrollment?: {
    admissionNumber: string;
    grade: number;
    stream?: string;
  };
  teachers: {
    id: string;
    teacherId: string;
    subjects: string[];
    streams: string[];
    isActive: boolean;
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      avatar?: string;
    } | null;
  }[];
}

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loadingMyCourses, setLoadingMyCourses] = useState(false);

  const isTeacher = user?.role === 'teacher';
  const isTutor = user?.role === 'tutor';
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user?.institutionId) {
      fetchSchoolInfo();
    }
    if (isStudent) fetchEnrolledCourses();
    if (isTeacher || isTutor) fetchMyCourses();
  }, [user?.institutionId]);

  const fetchSchoolInfo = async () => {
    setLoadingSchool(true);
    try {
      const res = await api.get('/institutions/my-school');
      if (res.data) setSchoolInfo(res.data);
    } catch (err) {
      console.error('Failed to fetch school info:', err);
    } finally {
      setLoadingSchool(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await api.get('/enrollment/my-enrollments');
      setEnrolledCourses(res.data || []);
    } catch {
      setEnrolledCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchMyCourses = async () => {
    setLoadingMyCourses(true);
    try {
      const res = await api.get('/courses/my-courses');
      setMyCourses(res.data || []);
    } catch {
      setMyCourses([]);
    } finally {
      setLoadingMyCourses(false);
    }
  };

  const isCandidate = user?.role === 'student' && (Number(user?.grade) === 6 || Number(user?.grade) === 9);
  const theme = getTheme(user?.role || 'student', isCandidate);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const roleLabel = isTeacher ? 'Teacher' : isTutor ? 'Tutor' : isParent ? 'Parent' : isCandidate ? `Grade ${user?.grade} Candidate` : `Grade ${user?.grade || 'N/A'}`;

  /* ─── TEACHER / TUTOR DASHBOARD ─── */
  if (isTeacher || isTutor) {
    const teacherStats = [
      { label: 'My Courses', value: myCourses.length || '—', icon: BookOpen, color: 'text-blue-600' },
      { label: 'Total Students', value: schoolInfo?.institution?.totalStudents || '—', icon: Users, color: 'text-green-600' },
      { label: 'Active Classes', value: '—', icon: Target, color: 'text-purple-600' },
      { label: 'Pending Reviews', value: '—', icon: FileText, color: 'text-amber-600' },
    ];

    return (
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className={`${theme.mutedText} mt-1`}>
              {schoolInfo ? schoolInfo.institution.name : roleLabel}
              {' • '}Here's your teaching overview
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 ${theme.primaryLight} ${theme.primaryText} rounded-lg font-medium text-sm`}>
            <Sparkles className="w-4 h-4" />
            <span>Manage your courses and students</span>
          </div>
        </div>

        {/* School Info Card (if affiliated) */}
        {schoolInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{schoolInfo.institution.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {schoolInfo.institution.county}
                    </span>
                    <span className="text-xs text-slate-400">Code: {schoolInfo.institution.code}</span>
                    <span className="text-xs text-slate-400 capitalize">{schoolInfo.institution.type.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>

            {schoolInfo.institution.motto && (
              <p className="text-sm text-slate-600 italic mb-4">"{schoolInfo.institution.motto}"</p>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-indigo-100">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{schoolInfo.institution.totalStudents}</p>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> Students
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{schoolInfo.institution.totalTeachers}</p>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Teachers
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{schoolInfo.teachers.length}</p>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <FileText className="w-3 h-3" /> On Platform
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teacherStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${theme.cardBg} rounded-xl p-6 border ${theme.cardBorder} shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${theme.primaryLight} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${theme.primaryText}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className={`text-sm ${theme.mutedText} mt-1`}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* My Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm`}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
              <p className={`text-sm ${theme.mutedText} mt-1`}>Courses you manage</p>
            </div>
            <Link href="/my-courses" className="flex items-center gap-1 text-sm font-semibold text-[#47a263] hover:underline">
              Manage Courses <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {loadingMyCourses ? (
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
                      <span>{course.modulesCount || 0} modules</span>
                      <span>{course.lessonsCount || 0} lessons</span>
                      {course.studentsCount != null && <span>{course.studentsCount} students</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm p-6`}
          >
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/my-courses" className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#47a263]/30 hover:shadow-md transition-all">
                <BookOpen className="w-5 h-5 text-[#47a263]" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">My Courses</p>
                  <p className="text-xs text-slate-500">Create & manage</p>
                </div>
              </Link>
              <Link href="/course-hub" className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#47a263]/30 hover:shadow-md transition-all">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Course Hub</p>
                  <p className="text-xs text-slate-500">Timetable & classes</p>
                </div>
              </Link>
              <Link href="/students" className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#47a263]/30 hover:shadow-md transition-all">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Students</p>
                  <p className="text-xs text-slate-500">View & manage</p>
                </div>
              </Link>
              <Link href="/analytics" className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#47a263]/30 hover:shadow-md transition-all">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Analytics</p>
                  <p className="text-xs text-slate-500">Performance data</p>
                </div>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm p-6`}
          >
            <h2 className="text-lg font-bold text-slate-900 mb-4">Your Teachers</h2>
            {schoolInfo?.teachers.length ? (
              <div className="space-y-3">
                {schoolInfo.teachers.slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                      {t.teacher?.firstName?.[0]}{t.teacher?.lastName?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.teacher?.firstName} {t.teacher?.lastName}</p>
                      <p className="text-xs text-slate-500">{t.subjects?.join(', ') || 'Teacher'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No colleague data available</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── STUDENT DASHBOARD (original) ─── */
  const stats = [
    { label: 'Practice Sessions', value: '24', change: '+12%', icon: Target, color: 'text-blue-600' },
    { label: 'Average Score', value: '87%', change: '+5%', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Time Spent', value: '18.5h', change: '+3.2h', icon: Clock, color: 'text-purple-600' },
    { label: 'Achievements', value: '12', change: '+2', icon: Award, color: 'text-amber-600' },
  ];

  const recentActivities = [
    { subject: 'Mathematics', topic: 'Fractions & Decimals', score: '92%', date: '2 hours ago', type: 'Practice' },
    { subject: 'English', topic: 'Comprehension', score: '88%', date: '5 hours ago', type: 'Assignment' },
    { subject: 'Science', topic: 'Plant Biology', score: '95%', date: 'Yesterday', type: 'Quiz' },
    { subject: 'Kiswahili', topic: 'Sarufi - Nomino', score: '85%', date: '2 days ago', type: 'Practice' },
  ];

  const upcomingTasks = [
    { title: 'Mathematics Quiz', subject: 'Algebra Basics', due: 'Tomorrow, 10:00 AM', priority: 'high' },
    { title: 'English Essay', subject: 'Creative Writing', due: 'Wed, 3:00 PM', priority: 'medium' },
    { title: 'Science Lab Report', subject: 'Photosynthesis', due: 'Fri, 12:00 PM', priority: 'low' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className={`${theme.mutedText} mt-1`}>
            {schoolInfo
              ? `${schoolInfo.institution.name} • Grade ${schoolInfo.enrollment?.grade}${schoolInfo.enrollment?.stream ? ` ${schoolInfo.enrollment.stream}` : ''}`
              : isCandidate
                ? `Grade ${user?.grade} KPSEA Candidate`
                : `Grade ${user?.grade || 'N/A'}`}
            {' • '}Here's your learning overview
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 px-4 py-2 ${theme.primaryLight} ${theme.primaryText} rounded-lg font-medium text-sm`}>
          <Sparkles className="w-4 h-4" />
          <span>Keep up the great work!</span>
        </div>
      </div>

      {/* School Info Card (if affiliated) */}
      {schoolInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{schoolInfo.institution.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {schoolInfo.institution.county}
                  </span>
                  <span className="text-xs text-slate-400">Code: {schoolInfo.institution.code}</span>
                  <span className="text-xs text-slate-400 capitalize">{schoolInfo.institution.type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-indigo-600">Adm: {schoolInfo.enrollment?.admissionNumber}</p>
              <p className="text-xs text-slate-500">Grade {schoolInfo.enrollment?.grade}{schoolInfo.enrollment?.stream ? ` ${schoolInfo.enrollment.stream}` : ''}</p>
            </div>
          </div>

          {schoolInfo.institution.motto && (
            <p className="text-sm text-slate-600 italic mb-4">"{schoolInfo.institution.motto}"</p>
          )}

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-indigo-100">
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">{schoolInfo.institution.totalStudents}</p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <Users className="w-3 h-3" /> Students
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">{schoolInfo.institution.totalTeachers}</p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <GraduationCap className="w-3 h-3" /> Teachers
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">{schoolInfo.teachers.length}</p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <FileText className="w-3 h-3" /> On Platform
              </p>
            </div>
          </div>

          {/* Teachers List */}
          {schoolInfo.teachers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-indigo-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Your Teachers
              </h3>
              <div className="flex flex-wrap gap-3">
                {schoolInfo.teachers.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200">
                    {t.teacher?.avatar ? (
                      <Image src={getAvatarUrl(t.teacher.avatar)} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {t.teacher?.firstName?.[0]}{t.teacher?.lastName?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{t.teacher?.firstName} {t.teacher?.lastName}</p>
                      <p className="text-[10px] text-slate-500">{t.subjects?.join(', ') || 'Teacher'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${theme.cardBg} rounded-xl p-6 border ${theme.cardBorder} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${theme.primaryLight} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${theme.primaryText}`} />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className={`text-sm ${theme.mutedText} mt-1`}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Enrolled Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
            <p className={`text-sm ${theme.mutedText} mt-1`}>Continue where you left off</p>
          </div>
          <Link href="/courses" className="flex items-center gap-1 text-sm font-semibold text-[#47a263] hover:underline">
            Browse Courses <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-4">
          {loadingCourses ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-[#47a263]/30 border-t-[#47a263] rounded-full animate-spin" />
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No courses yet</p>
              <p className="text-xs text-slate-300 mt-1">Enroll in a course to get started</p>
              <Link href="/courses" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#47a263] text-white font-semibold text-sm rounded-xl hover:bg-[#3d8b55] transition-all">
                Explore Courses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map((course: any) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.courseId}`}
                  className="group block p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#47a263]/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#47a263]/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-[#47a263]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#47a263] transition-colors">
                        {course.courseTitle}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {course.status === 'completed' ? '✅ Completed' : course.status === 'dropped' ? '⏹️ Dropped' : '📖 In Progress'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-semibold text-slate-700">{course.progressPercentage || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#47a263] rounded-full transition-all duration-500"
                        style={{ width: `${course.progressPercentage || 0}%` }}
                      />
                    </div>
                  </div>
                  {course.status === 'active' && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#47a263] opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-3.5 h-3.5" /> Continue Learning →
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className={`lg:col-span-2 ${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm`}>
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Recent Activities</h2>
            <p className={`text-sm ${theme.mutedText} mt-1`}>Your latest learning progress</p>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${theme.primaryLight} rounded-lg flex items-center justify-center`}>
                    <BookOpen className={`w-5 h-5 ${theme.primaryText}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{activity.subject}</p>
                    <p className={`text-sm ${theme.mutedText}`}>{activity.topic}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{activity.score}</p>
                  <p className="text-xs text-slate-400">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100">
            <button className={`w-full flex items-center justify-center gap-2 py-2 ${theme.primaryText} font-medium text-sm ${theme.primaryHover} rounded-lg transition-colors`}>
              View All Activities
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm`}>
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Tasks</h2>
            <p className={`text-sm ${theme.mutedText} mt-1`}>Don't miss your deadlines</p>
          </div>
          <div className="p-4 space-y-3">
            {upcomingTasks.map((task, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {task.priority}
                  </span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">{task.title}</p>
                <p className={`text-xs ${theme.mutedText} mt-1`}>{task.subject}</p>
                <p className="text-xs text-slate-400 mt-2">{task.due}</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100">
            <button className={`w-full flex items-center justify-center gap-2 py-2 ${theme.primaryText} font-medium text-sm ${theme.primaryHover} rounded-lg transition-colors`}>
              View All Tasks
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
