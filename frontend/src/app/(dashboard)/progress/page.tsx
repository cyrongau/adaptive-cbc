'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  TrendingUp, TrendingDown, Target, Award, BookOpen, Clock, Flame,
  Star, Calendar, BarChart3, PieChart, Activity, Users, Loader2, FileText,
} from 'lucide-react';

interface SubjectPerf {
  subjectId: string;
  subjectName: string;
  score: number;
  trend: string;
}

interface ChildData { id: string; student?: { id: string; firstName: string; lastName: string; grade: number } }

interface Report {
  summary: { overallProgress: number; strongAreas: string[]; areasForImprovement: string[]; totalTimeSpent: number; sessionsCompleted: number };
  subjectPerformance: SubjectPerf[];
  recentActivity: { date: string; activity: string; score: number }[];
  recommendations: { title: string; description: string; priority: string }[];
}

interface ProgressSummary {
  assignments: { total: number; graded: number; pending: number; averageScore: number };
  questionAttempts: { totalAttempts: number; totalCorrect: number; accuracy: number; subjectBreakdown: { subjectId: string; subjectName: string; accuracy: number; totalAttempts: number; totalCorrect: number; questionsAttempted: number; questionsCorrect: number; firstAttemptCorrect: number }[] };
  practiceSessions: { total: number; averageScore: number }[];
  userInfo: { xp: number; level: number; streak: number };
}

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProgressPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [report, setReport] = useState<Report | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const isParent = user?.role === 'parent';
  const isCandidate = Number(user?.grade) === 6 || Number(user?.grade) === 9;
  const primaryColor = isCandidate ? 'amber' : 'indigo';
  const userId = isParent ? selectedChild : user?.id;

  useEffect(() => {
    if (!user) return;
    if (isParent) {
      fetchChildren();
    } else {
      fetchProgress(user.id);
    }
  }, [user]);

  const fetchProgress = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/assignments/student/${id}/progress`);
      setProgress(res.data);
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
        if (first.student) setSelectedChild(first.student.id);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedChild || !isParent) return;
    fetchProgress(selectedChild);
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
    if (!progress?.practiceSessions) return DAYS_SHORT.map(d => ({ day: d, count: 0 }));
    const dayCount: Record<string, number> = {};
    for (const s of progress.practiceSessions) {
      try {
        const d = new Date((s as any).createdAt || Date.now());
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

            {progress && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'XP', value: (progress.userInfo?.xp || 0).toString(), sub: `Level ${progress.userInfo?.level || 1}`, icon: Star, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Assignments', value: `${progress.assignments?.graded || 0}/${progress.assignments?.total || 0}`, sub: `${progress.assignments?.averageScore || 0}% avg`, icon: FileText, color: 'bg-indigo-50 text-indigo-600' },
                  { label: 'Questions Attempted', value: (progress.questionAttempts?.totalAttempts || 0).toString(), sub: `${progress.questionAttempts?.accuracy || 0}% accuracy`, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Streak', value: `${progress.userInfo?.streak || 0} days`, icon: Flame, color: 'bg-orange-50 text-orange-600' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                    {stat.sub && <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>}
                  </motion.div>
                ))}
              </div>
            )}

            {progress?.questionAttempts?.subjectBreakdown && progress.questionAttempts.subjectBreakdown.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-emerald-600" />
                    Subject Performance
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {progress.questionAttempts.subjectBreakdown.map((s) => {
                    const barColor = s.accuracy >= 70 ? 'bg-green-500' : s.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div key={s.subjectId}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold text-slate-700">{s.subjectName}</span>
                          <span className="font-bold text-slate-900">{s.accuracy}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div className={`${barColor} h-3 rounded-full transition-all duration-1000`} style={{ width: `${s.accuracy}%` }} />
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-slate-400">
                          <span>{s.totalAttempts} attempts</span>
                          <span>{s.totalCorrect} correct</span>
                          <span>{s.firstAttemptCorrect} first-try</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {generatingReport ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : report ? (
              <>
                {report.summary.areasForImprovement.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <h2 className="font-bold text-slate-900 mb-2">Areas for Improvement</h2>
                    <p className="text-sm text-slate-600">{report.summary.areasForImprovement.join(', ')}</p>
                  </motion.div>
                )}
              </>
            ) : progress && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">Select a child to view their detailed progress report.</p>
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

  const subBreakdown = progress?.questionAttempts?.subjectBreakdown || [];
  const totalAccuracy = progress?.questionAttempts?.accuracy || 0;
  const totalAttempts = progress?.questionAttempts?.totalAttempts || 0;
  const totalCorrect = progress?.questionAttempts?.totalCorrect || 0;
  const avgAssignmentScore = progress?.assignments?.averageScore || 0;
  const xp = progress?.userInfo?.xp || 0;
  const level = progress?.userInfo?.level || 1;
  const streak = progress?.userInfo?.streak || 0;

  const statCards = [
    { label: 'XP', value: xp.toString(), sub: `Level ${level}`, icon: Star, trend: 'up' },
    { label: 'Accuracy', value: `${totalAccuracy}%`, sub: `${totalCorrect}/${totalAttempts} correct`, icon: Target, trend: 'up' },
    { label: 'Assignment Avg', value: `${avgAssignmentScore}%`, sub: `${progress?.assignments?.graded || 0} graded`, icon: FileText, trend: 'up' },
    { label: 'Streak', value: `${streak} days`, icon: Flame, sub: `${progress?.assignments?.pending || 0} pending`, trend: 'neutral' },
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BarChart3 className={`w-5 h-5 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
            Subject Breakdown
          </h2>
          {subBreakdown.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No data yet. Start practicing!</p>
          ) : (
            <div className="space-y-4">
              {subBreakdown.map((s) => {
                const barColor = s.accuracy >= 70 ? 'bg-green-500' : s.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <div key={s.subjectId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{s.subjectName}</span>
                      <span className="font-semibold text-slate-900">{s.accuracy}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`${barColor} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${s.accuracy}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {subBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Target className={`w-6 h-6 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
              Subject Details
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {subBreakdown.map((s) => (
              <div key={s.subjectId} className="p-6 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900">{s.subjectName}</h3>
                  <p className="text-sm text-slate-500">{s.totalAttempts} questions attempted</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{s.accuracy}%</span>
                    {s.accuracy >= 80 && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-xs text-slate-500">{s.totalCorrect} correct ({s.firstAttemptCorrect} first-try)</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
