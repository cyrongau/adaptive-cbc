'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Users,
  BookOpen,
  Award,
} from 'lucide-react';

export default function TeacherAnalyticsPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const performanceData = [
    { subject: 'Math', avgScore: 82, completion: 95 },
    { subject: 'English', avgScore: 78, completion: 88 },
    { subject: 'Science', avgScore: 85, completion: 92 },
    { subject: 'Kiswahili', avgScore: 76, completion: 85 },
    { subject: 'Social Studies', avgScore: 80, completion: 90 },
  ];

  const trendData = [
    { week: 'Week 1', engagement: 65, performance: 72 },
    { week: 'Week 2', engagement: 70, performance: 75 },
    { week: 'Week 3', engagement: 68, performance: 78 },
    { week: 'Week 4', engagement: 75, performance: 80 },
    { week: 'Week 5', engagement: 80, performance: 82 },
    { week: 'Week 6', engagement: 85, performance: 85 },
  ];

  const stats = [
    { label: 'Total Students', value: '156', icon: Users, change: '+12' },
    { label: 'Active Classes', value: '8', icon: BookOpen, change: '0' },
    { label: 'Avg Performance', value: '82%', icon: TrendingUp, change: '+5%' },
    { label: 'Assignments Given', value: '48', icon: Award, change: '+8' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Track student performance and engagement</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance by Subject */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Performance by Subject</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="subject" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement & Performance Trend */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">6-Week Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Line type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="performance" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Detailed Subject Analytics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Avg Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Completion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {performanceData.map((subject, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{subject.subject}</td>
                  <td className="px-6 py-4 text-slate-600">{subject.avgScore}%</td>
                  <td className="px-6 py-4 text-slate-600">{subject.completion}%</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      subject.avgScore >= 80 ? 'bg-green-100 text-green-700' :
                      subject.avgScore >= 70 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {subject.avgScore >= 80 ? 'Excellent' : subject.avgScore >= 70 ? 'Good' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
