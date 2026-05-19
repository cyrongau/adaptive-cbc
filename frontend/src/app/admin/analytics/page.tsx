'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart3, TrendingUp, Users, BookOpen, GraduationCap, Award } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [institutionData, setInstitutionData] = useState<any>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      if (isSuperAdmin) {
        const response = await api.get('/analytics/admin/platform-stats');
        setStats(response.data);
      } else {
        const [usersRes, institutionsRes] = await Promise.all([
          api.get('/users'),
          api.get('/institutions'),
        ]);
        const teachers = usersRes.data.filter((u: any) => u.role === 'teacher');
        const students = usersRes.data.filter((u: any) => u.role === 'student');
        setInstitutionData({
          totalTeachers: teachers.length,
          totalStudents: students.length,
          activeTeachers: teachers.filter((t: any) => t.isActive).length,
          activeStudents: students.filter((s: any) => s.isActive).length,
        });
      }
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#dae2fd]">
          {isSuperAdmin ? 'Platform Analytics' : 'Institution Analytics'}
        </h2>
        <p className="text-sm text-[#becabd] mt-1">
          {isSuperAdmin ? 'Detailed platform performance metrics.' : 'Overview of your institution\'s performance.'}
        </p>
      </div>

      {/* Stats Grid */}
      {isSuperAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-[#7eda95]' },
            { label: 'Active Sessions', value: stats?.totalSessions || 0, icon: BookOpen, color: 'text-[#89ceff]' },
            { label: 'Avg Score', value: `${stats?.averageScore || 0}%`, icon: TrendingUp, color: 'text-[#7eda95]' },
            { label: 'Questions Attempted', value: stats?.totalQuestionsAttempted || 0, icon: BarChart3, color: 'text-[#b7c8e1]' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
              <stat.icon className={`w-6 h-6 ${stat.color} mb-4`} />
              <p className="text-2xl font-bold text-[#dae2fd]">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-[#becabd] mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Teachers', value: institutionData?.totalTeachers || 0, icon: Users, color: 'text-[#7eda95]' },
            { label: 'Total Students', value: institutionData?.totalStudents || 0, icon: GraduationCap, color: 'text-[#89ceff]' },
            { label: 'Active Teachers', value: institutionData?.activeTeachers || 0, icon: Award, color: 'text-[#7eda95]' },
            { label: 'Active Students', value: institutionData?.activeStudents || 0, icon: BookOpen, color: 'text-[#b7c8e1]' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
              <stat.icon className={`w-6 h-6 ${stat.color} mb-4`} />
              <p className="text-2xl font-bold text-[#dae2fd]">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-[#becabd] mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Growth Chart */}
      {isSuperAdmin && stats?.monthlyGrowth && (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#dae2fd] mb-6">Monthly User Growth</h3>
          <div className="h-64 flex items-end justify-between px-4 pb-4 relative">
            <div className="absolute inset-0 border-b border-l border-[#3f4940] opacity-20"></div>
            {stats.monthlyGrowth.map((item: { month: string; count: string }, i: number) => {
              const height = Math.max(20, (parseInt(item.count) / 50) * 100);
              return (
                <div key={item.month} className="w-8 bg-[#7eda95]/30 hover:bg-[#7eda95]/50 rounded-t transition-all" style={{ height: `${height}%` }} />
              );
            })}
          </div>
          <div className="flex justify-between px-4 mt-2">
            {stats.monthlyGrowth.map((item: { month: string }) => (
              <span key={item.month} className="text-[10px] text-[#becabd]">{item.month}</span>
            ))}
          </div>
        </div>
      )}

      {/* Institution Summary (for institution_admin) */}
      {!isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#dae2fd] mb-6">Teacher Distribution</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#becabd]">Active Teachers</span>
                <span className="text-sm font-bold text-[#7eda95]">{institutionData?.activeTeachers || 0}</span>
              </div>
              <div className="h-2 w-full bg-[#060e20] rounded-full overflow-hidden">
                <div className="h-full bg-[#7eda95]" style={{ width: `${institutionData?.totalTeachers ? (institutionData.activeTeachers / institutionData.totalTeachers) * 100 : 0}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#becabd]">Inactive Teachers</span>
                <span className="text-sm font-bold text-[#becabd]">{(institutionData?.totalTeachers || 0) - (institutionData?.activeTeachers || 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#dae2fd] mb-6">Student Distribution</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#becabd]">Active Students</span>
                <span className="text-sm font-bold text-[#89ceff]">{institutionData?.activeStudents || 0}</span>
              </div>
              <div className="h-2 w-full bg-[#060e20] rounded-full overflow-hidden">
                <div className="h-full bg-[#89ceff]" style={{ width: `${institutionData?.totalStudents ? (institutionData.activeStudents / institutionData.totalStudents) * 100 : 0}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#becabd]">Inactive Students</span>
                <span className="text-sm font-bold text-[#becabd]">{(institutionData?.totalStudents || 0) - (institutionData?.activeStudents || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
