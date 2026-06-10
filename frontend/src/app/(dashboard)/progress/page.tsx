'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  TrendingUp, TrendingDown, Target, Award, BookOpen, Clock, Flame,
  Star, Calendar, BarChart3, PieChart, Activity, Users, Loader2,
} from 'lucide-react';

interface SubjectPerf {
  subjectId: string;
  subjectName: string;
  score: number;
  trend: string;
}

interface StatsData {
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  totalTimeMinutes: number;
  averageScore: number;
  successRate: number;
}

interface DashboardData {
  stats: StatsData;
  weakAreas: { subjectId: string; successRate: number; totalAttempts: number }[];
  recentInsights: any[];
  streak: number;
  metrics: {
    practiceSessions: number;
    averageScore: number;
    recentAverageScore: number;
    successRate: number;
    totalTimeMinutes: number;
    recentTimeMinutes: number;
    totalQuestions: number;
    totalCorrect: number;
    totalAttempted: number;
  };
  recentActivities: { id: string; subject: string; topic: string; score: number; date: string }[];
  upcomingTasks: any[];
}

interface Badge { id: string; badgeName: string; badgeType: string; description: string }

interface ChildData { id: string; student?: { id: string; firstName: string; lastName: string; grade: number } }

interface Report {
  summary: { overallProgress: number; strongAreas: string[]; areasForImprovement: string[]; totalTimeSpent: number; sessionsCompleted: number };
  subjectPerformance: SubjectPerf[];
  recentActivity: { date: string; activity: string; score: number }[];
  recommendations: { title: string; description: string; priority: string }[];
}

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProgressPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [report, setReport] = useState<Report | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const isParent = user?.role === 'parent';
  const isCandidate = Number(user?.grade) === 6 || Number(user?.grade) === 9;
  const primaryColor = isCandidate ? 'amber' : 'indigo';

  useEffect(() => {
    if (!user) return;
    if (isParent) {
      fetchChildren();
    } else {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [dashRes, badgesRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/gamification/badges').catch(() => ({ data: [] })),
      ]);
      setDashboard(dashRes.data);
      setBadges(badgesRes.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/relationships/parent/${user!.id}/children`);
      const kids = res.data || [];
      setChildren(kids);
      if (kids.length > 0) {
        const first = kids[0];
        if (first.student) {
          setSelectedChild(first.student.id);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedChild || !isParent) return;
    generateReportForChild(selectedChild);
  }, [selectedChild]);

  const generateReportForChild = async (childId: string) => {
    setGeneratingReport(true);
    try {
      const res = await api.post('/analytics/parent/report/generate', { childId });
      setReport(res.data);
    } catch { setReport(null); }
    setGeneratingReport(false);
  };

  if (!user) return null;

  const getWeeklyActivity = (): { day: string; count: number }[] => {
    if (!dashboard?.recentActivities) return DAYS_SHORT.map(d => ({ day: d, count: 0 }));
    const dayCount: Record<string, number> = {};
    for (const act of dashboard.recentActivities) {
      try {
        const d = new Date(act.date);
        const dayName = DAYS_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1];
        dayCount[dayName] = (dayCount[dayName] || 0) + 1;
      } catch { /* ignore */ }
    }
    return DAYS_SHORT.map(d => ({ day: d, count: dayCount[d] || 0 }));
  };

  const weeklyActivity = getWeeklyActivity();
  const maxActivity = Math.max(...weeklyActivity.map(w => w.count), 1);

  if (isParent) {
    return (
      <div className="space-y-8">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Progress <span className="text-emerald-600">Reports</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-600 mt-2">
            Track your children's learning journey
          </motion.p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No children linked yet.</p>
            <p className="text-slate-400 mt-1">Your student needs to invite you or the school must register you as a parent.</p>
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-4">Select Child</h2>
              <div className="flex gap-4 flex-wrap">
                {children.map((rel) => {
                  const child = rel.student;
                  if (!child) return null;
                  const isActive = child.id === selectedChild;
                  return (
                    <button key={rel.id} onClick={() => setSelectedChild(child.id)}
                      className={`flex-1 min-w-[200px] p-4 rounded-xl border-2 transition-all ${isActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${Number(child.grade) === 6 ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {child.firstName?.[0]}{child.lastName?.[0]}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-900">{child.firstName} {child.lastName}</p>
                          <p className="text-sm text-slate-500">Grade {child.grade}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {generatingReport ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : report ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Overall Progress', value: `${report.summary.overallProgress}%`, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
                    { label: 'Sessions Completed', value: report.summary.sessionsCompleted.toString(), icon: Award, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Time Spent', value: `${Math.round(report.summary.totalTimeSpent / 60)}h`, icon: Clock, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Strong Areas', value: report.summary.strongAreas.length.toString(), icon: Flame, color: 'bg-orange-50 text-orange-600' },
                  ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                      <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {report.subjectPerformance.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-emerald-600" />
                        Subject Performance
                      </h2>
                    </div>
                    <div className="p-6 space-y-6">
                      {report.subjectPerformance.map((s, i) => {
                        const barColor = s.score >= 70 ? 'bg-green-500' : s.score >= 50 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-semibold text-slate-700">{s.subjectName}</span>
                              <span className="font-bold text-slate-900">{s.score}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div className={`${barColor} h-3 rounded-full transition-all duration-1000`} style={{ width: `${s.score}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {report.summary.areasForImprovement.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <h2 className="font-bold text-slate-900 mb-2">Areas for Improvement</h2>
                    <p className="text-sm text-slate-600">{report.summary.areasForImprovement.join(', ')}</p>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No report available yet. The student needs to complete some practice sessions first.</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Student View
  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  const stats = dashboard?.stats || { totalSessions: 0, totalQuestions: 0, totalCorrect: 0, totalTimeMinutes: 0, averageScore: 0, successRate: 0 };
  const metrics = dashboard?.metrics || { ...stats, practiceSessions: stats.totalSessions, recentAverageScore: stats.averageScore, recentTimeMinutes: 0, totalAttempted: 0, totalCorrect: 0 };
  const weakAreas = dashboard?.weakAreas || [];
  const recentActivities = dashboard?.recentActivities || [];

  const statCards = [
    { label: 'Overall Progress', value: `${metrics.successRate || metrics.averageScore || 0}%`, icon: TrendingUp, sub: `${metrics.recentAverageScore || 0}% recent avg`, trend: 'up' },
    { label: 'Practice Sessions', value: metrics.practiceSessions?.toString() || '0', icon: Award, sub: `${metrics.totalQuestions || 0} questions`, trend: 'up' },
    { label: 'Time Spent', value: `${Math.round((metrics.totalTimeMinutes || 0) / 60)}h`, icon: Clock, sub: `${metrics.recentTimeMinutes || 0}min this week`, trend: 'up' },
    { label: 'Current Streak', value: `${dashboard?.streak || 0} days`, icon: Flame, sub: `${weakAreas.length} areas to improve`, trend: 'neutral' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-extrabold text-slate-900">
          My <span className={isCandidate ? 'text-amber-600' : 'text-indigo-600'}>Progress</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-600 mt-2">
          Track your learning journey and achievements
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCandidate ? 'bg-amber-100' : 'bg-indigo-100'}`}>
                <stat.icon className={`w-6 h-6 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
              </div>
              {stat.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
              {stat.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
            </div>
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className={`w-5 h-5 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
            Recent Activity
          </h2>
          {recentActivities.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No activity yet. Start practicing!</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.slice(0, 7).map((act) => (
                <div key={act.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{act.subject}</p>
                    <p className="text-xs text-slate-500">{act.topic}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{act.score}%</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <PieChart className={`w-5 h-5 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
            Weekly Activity
          </h2>
          <div className="flex items-end justify-between h-40 gap-2">
            {weeklyActivity.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className={`w-full rounded-t-lg ${isCandidate ? 'bg-amber-500' : 'bg-indigo-500'} transition-all`}
                  style={{ height: `${(day.count / maxActivity) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }} />
                <span className="text-xs text-slate-500 mt-2">{day.day}</span>
                <span className="text-[10px] text-slate-400">{day.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {recentActivities.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Target className={`w-6 h-6 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
              Recent Sessions
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivities.slice(0, 10).map((act) => (
              <div key={act.id} className="p-6 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${act.score >= 80 ? 'bg-green-100' : act.score >= 50 ? 'bg-amber-100' : 'bg-red-100'}`}>
                    <BookOpen className={`w-6 h-6 ${act.score >= 80 ? 'text-green-600' : act.score >= 50 ? 'text-amber-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{act.subject}</h3>
                    <p className="text-sm text-slate-500">{act.topic}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{act.score}%</span>
                    {act.score >= 80 && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-xs text-slate-500">{new Date(act.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {badges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Award className={`w-5 h-5 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
            Achievements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className={`p-4 rounded-xl text-center ${isCandidate ? 'bg-amber-50' : 'bg-indigo-50'}`}>
                <span className="text-3xl">🏆</span>
                <p className="font-bold text-slate-900 mt-2">{badge.badgeName}</p>
                <p className="text-xs text-slate-500">{badge.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
