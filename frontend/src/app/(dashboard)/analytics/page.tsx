'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, Users, BookOpen, Award, BarChart3, Brain, FileText, RotateCcw, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [contentMetrics, setContentMetrics] = useState<any>(null);
  const [aiUsage, setAiUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'institution_admin';

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isMounted, isAdmin, router]);

  useEffect(() => {
    if (isMounted && isAdmin) fetchData();
  }, [isMounted, isAdmin, period]);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      if (isAdmin) {
        const [statsRes, contentRes, aiRes] = await Promise.allSettled([
          api.get('/analytics/admin/platform-stats'),
          api.get(`/analytics/admin/content-metrics?period=${period}`),
          api.get(`/analytics/admin/ai-usage?period=${period}`),
        ]);
        if (statsRes.status === 'fulfilled') setPlatformStats(statsRes.value.data);
        if (contentRes.status === 'fulfilled') setContentMetrics(contentRes.value.data);
        if (aiRes.status === 'fulfilled') setAiUsage(aiRes.value.data);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const userBreakdown = platformStats ? [
    { name: 'Students', value: platformStats.students || 0 },
    { name: 'Teachers', value: platformStats.teachers || 0 },
    { name: 'Tutors', value: platformStats.tutors || 0 },
    { name: 'Parents', value: platformStats.parents || 0 },
  ].filter(d => d.value > 0) : [];

  const questionStatusData = contentMetrics?.byStatus ? [
    { name: 'Published', value: contentMetrics.byStatus.published || 0 },
    { name: 'Approved', value: contentMetrics.byStatus.approved || 0 },
    { name: 'Pending', value: contentMetrics.byStatus.pendingReview || 0 },
    { name: 'Draft', value: contentMetrics.byStatus.drafts || 0 },
  ].filter(d => d.value > 0) : [];

  const summaryStats = [
    { label: 'Total Users', value: platformStats?.totalUsers ?? '—', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Questions', value: contentMetrics?.totalQuestions ?? '—', icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'AI Calls', value: aiUsage?.totalAiCalls ?? '—', icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Sessions', value: platformStats?.totalSessions ?? '—', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Platform-wide statistics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          {(['week', 'month', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <button onClick={fetchData} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">Some data could not be loaded. Check that the backend is running.</p>
          <button onClick={fetchData} className="ml-auto text-sm font-semibold text-amber-700 hover:underline">Retry</button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
          >
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 w-10 bg-slate-100 rounded-lg" />
                <div className="h-7 bg-slate-100 rounded w-16" />
                <div className="h-4 bg-slate-100 rounded w-24" />
              </div>
            ) : (
              <>
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">User Breakdown</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : userBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={userBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {userBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">No user data available</div>
          )}
        </div>

        {/* Question Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Question Status</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : questionStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={questionStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {questionStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">No question data available</div>
          )}
        </div>
      </div>

      {/* Content creation trend */}
      {!loading && contentMetrics?.trend?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Content Creation Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={contentMetrics.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Questions Created" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Usage trend */}
      {!loading && aiUsage?.dailyTrend?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">AI Usage Trend</h2>
          <p className="text-sm text-slate-500 mb-6">Daily AI API calls over the selected period</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={aiUsage.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="AI Calls" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Content Creators */}
      {!loading && contentMetrics?.perTeacher?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Top Content Creators</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Teacher ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Questions Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contentMetrics.perTeacher.slice(0, 10).map((t: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-500 text-sm">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 font-mono text-sm">{t.teacher || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{t.count}</span>
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${Math.min(100, (t.count / (contentMetrics.perTeacher[0]?.count || 1)) * 100)}%` }}
                          />
                        </div>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Growth */}
      {!loading && platformStats?.monthlyGrowth?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Monthly User Growth</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={platformStats.monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" name="New Users" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
