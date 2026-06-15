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
  ShieldCheck, Activity, UserCheck, AlertCircle, ClipboardCheck,
  School, AlarmCheck, ListChecks,
} from 'lucide-react';
import RecommendationsWidget from '@/components/RecommendationsWidget';
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
  const { user, refreshUser } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loadingMyCourses, setLoadingMyCourses] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [timetableData, setTimetableData] = useState<any>(null);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  const isTeacher = user?.role === 'teacher';
  const isTutor = user?.role === 'tutor';
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'institution_admin';

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      refreshUser();
    }
  }, []);

  useEffect(() => {
    if (user?.institutionId) {
      fetchSchoolInfo();
    }
    if (user?.id) {
      if (isAdmin) {
        fetchAdminDashboard();
      } else {
        fetchDashboardData();
      }
    }
    if (isStudent) fetchEnrolledCourses();
    if (isTeacher || isTutor) {
      fetchMyCourses();
      fetchTeacherTimetable();
      fetchPendingSubmissions();
    }
  }, [user?.id, user?.institutionId]);

  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const res = await api.get('/analytics/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      setDashboardData(null);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchAdminDashboard = async () => {
    setLoadingAdmin(true);
    try {
      const [statsRes, activityRes] = await Promise.allSettled([
        api.get('/analytics/admin/platform-stats'),
        api.get('/analytics/admin/recent-activity'),
      ]);
      if (statsRes.status === 'fulfilled') setPlatformStats(statsRes.value.data);
      if (activityRes.status === 'fulfilled') setRecentActivity(activityRes.value.data || []);
    } catch (err) {
      console.error('Failed to fetch admin dashboard:', err);
    } finally {
      setLoadingAdmin(false);
    }
  };

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

  const fetchTeacherTimetable = async () => {
    setLoadingTimetable(true);
    try {
      const res = await api.get('/lessons/timetable');
      setTimetableData(res.data);
    } catch {
      setTimetableData(null);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const fetchPendingSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const assignmentsRes = await api.get('/assignments/my-assignments');
      const assignments = assignmentsRes.data || [];
      const firstThree = assignments.slice(0, 3);
      const results: any[] = [];
      for (const a of firstThree) {
        try {
          const subsRes = await api.get(`/assignments/${a.id}/submissions`);
          const pending = (subsRes.data || []).filter((s: any) => s.status === 'submitted');
          pending.forEach((s: any) => {
            results.push({ ...s, assignmentTitle: a.title, assignmentId: a.id });
          });
        } catch {
          // skip assignment if submissions fail
        }
      }
      results.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setPendingSubmissions(results.slice(0, 8));
    } catch {
      setPendingSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
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

  /* ─── ADMIN DASHBOARD ─── */
  if (isAdmin) {
    const adminStats = [
      { label: 'Total Users', value: platformStats?.totalUsers ?? '—', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Active Users', value: platformStats?.activeUsers ?? '—', icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Students', value: platformStats?.students ?? '—', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Teachers', value: (platformStats?.teachers ?? 0) + (platformStats?.tutors ?? 0) || '—', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];
    const byGrade = platformStats?.usersByGrade || [];
    const growth = platformStats?.monthlyGrowth || [];

    return (
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Admin Dashboard 🛡️
            </h1>
            <p className="text-slate-500 mt-1">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Institution Admin'} · Platform overview
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Control Panel</span>
          </div>
        </div>

        {/* Stats Grid */}
        {loadingAdmin ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse">
                <div className="h-10 w-10 bg-slate-100 rounded-lg mb-4" />
                <div className="h-7 bg-slate-100 rounded w-16 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-24" />
              </div>
            ))}
          </div>
        ) : platformStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">Could not load platform statistics. The analytics service may be unavailable.</p>
            <button onClick={fetchAdminDashboard} className="ml-auto text-sm font-semibold text-amber-700 hover:underline flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Sessions + Questions row */}
        {platformStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Practice Sessions</p>
              <p className="text-3xl font-bold text-slate-900">{platformStats.totalSessions?.toLocaleString() ?? '—'}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Questions Attempted</p>
              <p className="text-3xl font-bold text-slate-900">{platformStats.totalQuestionsAttempted?.toLocaleString() ?? '—'}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Platform Avg Score</p>
              <p className="text-3xl font-bold text-slate-900">{platformStats.averageScore ? `${platformStats.averageScore}%` : '—'}</p>
            </div>
          </div>
        )}

        {/* Main content: Recent activity + Quick links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
                <p className="text-sm text-slate-500 mt-0.5">Latest registrations and sessions</p>
              </div>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
            <div className="divide-y divide-slate-100">
              {loadingAdmin ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading activity...</div>
              ) : recentActivity.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">No recent activity found.</div>
              ) : recentActivity.slice(0, 10).map((item: any, i: number) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.type === 'user_created' ? 'bg-green-50' : 'bg-blue-50'
                    }`}>
                      {item.type === 'user_created'
                        ? <Users className="w-4 h-4 text-green-600" />
                        : <BookOpen className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">{item.description}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 shrink-0 ml-4">
                    {new Date(item.timestamp).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links + Grade Breakdown */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h2>
              <div className="space-y-2">
                {[
                  { href: '/school', label: 'School Management', icon: Building2 },
                  { href: '/analytics', label: 'Full Analytics', icon: BarChart3 },
                  { href: '/students', label: 'Students', icon: Users },
                  { href: '/teachers', label: 'Teachers', icon: GraduationCap },
                ].map(link => (
                  <Link key={link.href} href={link.href}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                    <link.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{link.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-400" />
                  </Link>
                ))}
              </div>
            </div>

            {byGrade.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Students by Grade</h2>
                <div className="space-y-2">
                  {byGrade.map((g: any) => (
                    <div key={g.grade} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Grade {g.grade}</span>
                      <span className="text-sm font-bold text-slate-900">{g.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Users Table */}
        {platformStats?.recentUsers?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Recent Registrations</h2>
              <p className="text-sm text-slate-500 mt-0.5">Latest users on the platform</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {platformStats.recentUsers.slice(0, 8).map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                          u.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                          u.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                          u.role === 'student' ? 'bg-green-100 text-green-700' :
                          u.role === 'parent' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(u.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── TEACHER / TUTOR DASHBOARD ─── */
  if (isTeacher || isTutor) {
    const totalLessons = timetableData?.totalLessons ?? dashboardData?.scheduledLessonsCount ?? 0;
    const todayName = new Date().toLocaleDateString('en-KE', { weekday: 'long' }).toLowerCase();
    const todayLessons = timetableData?.timetable?.find((d: any) => d.day === todayName)?.lessons || [];
    const weekDays = timetableData?.timetable || [];

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

        {/* AI Recommendations & Study Goals */}
        <RecommendationsWidget />
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
          <Link href="/my-courses" className="block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{dashboardData?.teacherCourseCount ?? myCourses.length ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">My Courses</p>
            </motion.div>
          </Link>
          <Link href="/students" className="block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{dashboardData?.teacherStudentCount ?? schoolInfo?.institution?.totalStudents ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">Total Students</p>
            </motion.div>
          </Link>
          <Link href="/schedule" className="block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{totalLessons}</p>
              <p className="text-sm text-slate-500 mt-1">Scheduled Lessons</p>
            </motion.div>
          </Link>
          <Link href="/assignments" className="block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{dashboardData?.pendingReviewsCount ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">Pending Reviews</p>
            </motion.div>
          </Link>
        </div>

        {/* My Courses + Today's Lessons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
                  <p className="text-sm text-slate-500 mt-1">Courses you manage</p>
                </div>
                <Link href="/my-courses" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline">
                  Manage Courses <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="p-4">
                {loadingMyCourses ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : myCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400">No courses yet</p>
                    <p className="text-xs text-slate-300 mt-1">Create your first course to get started</p>
                    <Link href="/my-courses" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-all">
                      Create Course <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myCourses.slice(0, 4).map((course: any) => (
                      <Link
                        key={course.id}
                        href={`/my-courses/${course.id}`}
                        className="group block p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                              {course.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 capitalize">
                              {course.status === 'published' ? 'Published' : course.status === 'archived' ? 'Archived' : 'Draft'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{course.totalModules ?? 0} modules</span>
                          <span>{course.totalLessons ?? 0} lessons</span>
                          <span>{course.totalStudents ?? 0} students</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Today's Lessons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Today&apos;s Lessons</h2>
              <p className="text-sm text-slate-500 mt-1">{todayName.charAt(0).toUpperCase() + todayName.slice(1)}</p>
            </div>
            <div className="p-4">
              {loadingTimetable ? (
                <div className="py-8 text-center text-sm text-slate-400">Loading schedule...</div>
              ) : todayLessons.length === 0 ? (
                <div className="py-8 text-center">
                  <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No lessons today</p>
                  <Link href="/schedule" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-indigo-600 hover:underline">
                    View full schedule <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayLessons.slice(0, 5).map((lesson: any) => (
                    <div key={lesson.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{lesson.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{lesson.startTime?.slice(0, 5)} - {lesson.endTime?.slice(0, 5)}</span>
                      </div>
                      {lesson.grade && <p className="text-xs text-slate-400 mt-0.5">Grade {lesson.grade}</p>}
                    </div>
                  ))}
                  {weekDays.some((d: any) => d.lessons.length > 0) && (
                    <Link href="/schedule" className="block text-center text-xs font-semibold text-indigo-600 hover:underline pt-2">
                      View Full Timetable ({totalLessons} lessons)
                    </Link>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Submissions + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Pending Submissions</h2>
                  <p className="text-sm text-slate-500 mt-1">Assignments awaiting grading</p>
                </div>
                <Link href="/assignments" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline">
                  All Assignments <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {loadingSubmissions ? (
                  <div className="p-8 text-center text-sm text-slate-400">Loading submissions...</div>
                ) : pendingSubmissions.length === 0 ? (
                  <div className="p-8 text-center">
                    <ClipboardCheck className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-400">No pending submissions</p>
                    <p className="text-xs text-slate-300 mt-1">All submissions have been graded</p>
                  </div>
                ) : (
                  pendingSubmissions.map((sub: any, i: number) => (
                    <div key={sub.id || i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{sub.assignmentTitle || 'Assignment'}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(sub.submittedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/assignments/${sub.assignmentId}`}
                        className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Grade
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/my-courses" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">My Courses</span>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-400" />
              </Link>
              <Link href="/course-hub" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                <Calendar className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Course Hub</span>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-400" />
              </Link>
              <Link href="/students" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                <Users className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Students</span>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-400" />
              </Link>
              <Link href="/schedule" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                <AlarmCheck className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Schedule</span>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-400" />
              </Link>
              <Link href="/assignments" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                <ListChecks className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Assignments</span>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-400" />
              </Link>
              <Link href="/analytics" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                <BarChart3 className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Analytics</span>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-400" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── PARENT DASHBOARD ─── */
  if (isParent) {
    return (
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className={`${theme.mutedText} mt-1`}>
              Monitor your children&apos;s learning journey from here
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/children" className="group block bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900">My Children</h3>
            <p className="text-sm text-slate-500 mt-1">View and manage your children&apos;s profiles</p>
          </Link>
          <Link href="/progress" className="group block bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900">Progress Reports</h3>
            <p className="text-sm text-slate-500 mt-1">View detailed progress and performance reports</p>
          </Link>
          <Link href="/course-hub" className="group block bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
              <BookOpen className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-900">Course Hub</h3>
            <p className="text-sm text-slate-500 mt-1">Explore courses and learning materials</p>
          </Link>
        </div>

        {/* Support Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Need help?</h2>
          <p className="text-sm text-slate-600">Visit the Children page to monitor learning activity, or check Progress Reports for detailed analytics on your child&apos;s performance.</p>
          <div className="flex gap-3 mt-4">
            <Link href="/children" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-all">
              <Users className="w-4 h-4" /> Go to Children
            </Link>
            <Link href="/progress" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all">
              <BarChart3 className="w-4 h-4" /> View Progress
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── STUDENT DASHBOARD (original) ─── */
  const liveMetrics = dashboardData?.metrics || {};
  const stats = [
    { label: 'Practice Sessions', value: liveMetrics.practiceSessions ?? 0, change: `${liveMetrics.totalQuestions ?? 0} questions`, icon: Target, color: 'text-blue-600' },
    { label: 'Average Score', value: `${liveMetrics.averageScore ?? 0}%`, change: `${liveMetrics.successRate ?? 0}% success`, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Time Spent', value: `${Math.round((liveMetrics.totalTimeMinutes ?? 0) / 60 * 10) / 10}h`, change: `${liveMetrics.recentTimeMinutes ?? 0}m recent`, icon: Clock, color: 'text-purple-600' },
    { label: 'Streak Days', value: dashboardData?.streak ?? 0, change: 'live', icon: Award, color: 'text-amber-600' },
  ];
  const recentActivities = dashboardData?.recentActivities || [];
  const upcomingTasks = dashboardData?.upcomingTasks || [];
  const formatActivityDate = (date: string) => new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
  const formatTaskDue = (due: string) => new Date(due).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

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
            {loadingDashboard ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading activity...</div>
            ) : recentActivities.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">No learning activity yet</p>
              </div>
            ) : recentActivities.map((activity: any, index: number) => (
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
                  <p className="font-bold text-slate-900">{activity.score}%</p>
                  <p className="text-xs text-slate-400">{formatActivityDate(activity.date)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100">
            <Link href="/progress" className={`w-full flex items-center justify-center gap-2 py-2 ${theme.primaryText} font-medium text-sm ${theme.primaryHover} rounded-lg transition-colors`}>
              View All Activities
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm`}>
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Tasks</h2>
            <p className={`text-sm ${theme.mutedText} mt-1`}>Don't miss your deadlines</p>
          </div>
          <div className="p-4 space-y-3">
            {loadingDashboard ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading tasks...</div>
            ) : upcomingTasks.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">No upcoming tasks</p>
              </div>
            ) : upcomingTasks.map((task: any, index: number) => (
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
                <p className="text-xs text-slate-400 mt-2">{formatTaskDue(task.due)}</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100">
            <Link href="/assignments" className={`w-full flex items-center justify-center gap-2 py-2 ${theme.primaryText} font-medium text-sm ${theme.primaryHover} rounded-lg transition-colors`}>
              View All Tasks
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
