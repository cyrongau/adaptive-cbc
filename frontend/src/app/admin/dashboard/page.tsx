'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Activity, 
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Download,
  RefreshCw,
  Crown,
  Shield,
  Building2
} from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  students: number;
  teachers: number;
  tutors: number;
  parents: number;
  activeUsers: number;
  legacyStudents: number;
  totalSessions: number;
  totalQuestionsAttempted: number;
  averageScore: string;
  usersByGrade: { grade: string; count: string }[];
  recentUsers: { id: string; name: string; email: string; role: string; grade: number | null; createdAt: string }[];
  monthlyGrowth: { month: string; count: string }[];
}

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

interface SubjectPopularity {
  subject: string;
  count: string;
  avgSuccessRate: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const theme = getTheme(user?.role || 'student', false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectPopularity[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes, subjectRes] = await Promise.all([
        api.get('/analytics/admin/platform-stats'),
        api.get('/analytics/admin/recent-activity'),
        api.get('/analytics/admin/subject-popularity'),
      ]);
      setStats(statsRes.data);
      setActivities(activityRes.data);
      setSubjects(subjectRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!isSuperAdmin && user?.institutionId) {
      api.get(`/institutions/${user.institutionId}`)
        .then(res => setInstitution(res.data))
        .catch(() => {});
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`w-12 h-12 border-4 ${isSuperAdmin ? 'border-amber-400' : 'border-[#7eda95]'} border-t-transparent rounded-full animate-spin`}></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${isSuperAdmin ? 'bg-amber-900/30 border border-amber-700' : 'bg-[#47a263]/20 border border-[#47a263]'} flex items-center justify-center shrink-0`}>
            {isSuperAdmin ? <Crown className="w-6 h-6 text-amber-400" /> : <Shield className="w-6 h-6 text-[#7eda95]" />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold text-[#dae2fd] tracking-tight" style={{ lineHeight: '44px', letterSpacing: '-0.02em' }}>
                {isSuperAdmin ? 'Platform Insights' : 'School Overview'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${isSuperAdmin ? 'bg-amber-900/30 text-amber-300 border-amber-700' : 'bg-[#47a263]/20 text-[#7eda95] border-[#47a263]'}`}>
                {isSuperAdmin ? 'Super Admin' : 'Inst. Admin'}
              </span>
            </div>
            {!isSuperAdmin && institution && (
              <div className="flex items-center gap-2 mt-2">
                <Building2 className="w-4 h-4 text-[#7eda95]" />
                <span className="text-sm font-semibold text-[#dae2fd]">{institution.name}</span>
                <span className="text-xs text-[#becabd] opacity-70">• {institution.code}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${institution.status === 'active' ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-[#becabd]/10 text-[#becabd]'}`}>
                  {institution.status}
                </span>
              </div>
            )}
            <p className="text-base text-[#becabd] mt-1">
              {isSuperAdmin ? 'Real-time oversight for the entire Lumina CBC ecosystem.' : 'Manage and monitor your institution\'s performance.'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-[#3f4940] text-[#dae2fd] text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-[#2d3449] transition-all uppercase tracking-wider">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-[#47a263] text-[#003919] text-xs font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all uppercase tracking-wider"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Stats
          </button>
        </div>
      </section>

      {/* Key Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Active Learners', value: stats?.students || 0, icon: Users, change: `${stats?.activeUsers || 0} active`, color: isSuperAdmin ? 'text-amber-400' : 'text-[#7eda95]' },
          { label: 'Verified Tutors', value: stats?.tutors || 0, icon: GraduationCap, change: '98.2%', color: isSuperAdmin ? 'text-amber-400' : 'text-[#7eda95]' },
          { label: 'Pending Approvals', value: stats?.legacyStudents || 0, icon: AlertCircle, change: 'Priority', color: 'text-[#89ceff]' },
          { label: 'Total Sessions', value: stats?.totalSessions || 0, icon: BookOpen, change: `${stats?.averageScore || 0}% avg`, color: isSuperAdmin ? 'text-amber-400' : 'text-[#7eda95]' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${isSuperAdmin ? 'bg-[#171f33] border-[#2a3a5c]' : 'bg-[#171f33] border-[#3f4940]'} border p-6 rounded-xl flex flex-col gap-2`}
          >
            <div className="flex justify-between items-start">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <span className={`text-[10px] font-semibold ${isSuperAdmin ? 'text-amber-400 bg-amber-900/20' : 'text-[#7eda95] bg-[#7eda95]/10'} px-2 py-0.5 rounded-full`}>{stat.change}</span>
            </div>
            <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-bold text-[#dae2fd]">{stat.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </section>

      {/* Bento Grid Main Content */}
      <div className="grid grid-cols-12 gap-4">
        {/* User Growth Chart */}
        <div className={`col-span-12 lg:col-span-8 ${theme.cardBg} border ${theme.cardBorder} rounded-xl p-6`}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-[#dae2fd]">{isSuperAdmin ? 'User Growth' : 'Student Growth'}</h3>
              <p className="text-sm text-[#becabd]">{isSuperAdmin ? 'Monthly learner vs tutor acquisition' : 'Monthly student enrollment trend'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isSuperAdmin ? 'bg-amber-400' : 'bg-[#7eda95]'}`}></span>
                <span className="text-[10px] text-[#becabd]">Learners</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#89ceff]"></span>
                <span className="text-[10px] text-[#becabd]">Tutors</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between px-4 pb-4 relative">
            <div className="absolute inset-0 border-b border-l border-[#3f4940] opacity-20"></div>
            {stats?.monthlyGrowth?.map((item, i) => {
              const height = Math.max(20, (parseInt(item.count) / 50) * 100);
              return (
                <motion.div
                  key={item.month}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.1 }}
                  className={`w-8 ${isSuperAdmin ? 'bg-amber-400/20 hover:bg-amber-400/40' : 'bg-[#7eda95]/20 hover:bg-[#7eda95]/40'} rounded-t transition-all`}
                />
              );
            })}
          </div>
          <div className="flex justify-between px-4 mt-2">
            {stats?.monthlyGrowth?.map((item) => (
              <span key={item.month} className="text-[10px] text-[#becabd]">{item.month}</span>
            ))}
          </div>
        </div>

        {/* System Health Widget */}
        <div className={`col-span-12 lg:col-span-4 ${theme.cardBg} border ${theme.cardBorder} rounded-xl p-6 flex flex-col`}>
          <h3 className="text-lg font-bold text-[#dae2fd] mb-6">{isSuperAdmin ? 'System Health' : 'Institution Health'}</h3>
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider">AI Processing Status</p>
                <span className={`text-xs font-semibold ${isSuperAdmin ? 'text-amber-400' : 'text-[#7eda95]'}`}>Stable</span>
              </div>
              <div className="h-2 w-full bg-[#060e20] rounded-full overflow-hidden">
                <div className={`h-full ${isSuperAdmin ? 'bg-amber-400' : 'bg-[#7eda95]'} w-[94%]`}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider">OCR Accuracy</p>
                <span className="text-xs font-semibold text-[#dae2fd]">99.4%</span>
              </div>
              <div className="h-2 w-full bg-[#060e20] rounded-full overflow-hidden">
                <div className="h-full bg-[#89ceff] w-[99%]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider">Server Latency</p>
                <span className={`text-xs font-semibold ${isSuperAdmin ? 'text-amber-400' : 'text-[#7eda95]'}`}>24ms</span>
              </div>
              <div className="h-2 w-full bg-[#060e20] rounded-full overflow-hidden">
                <div className={`h-full ${isSuperAdmin ? 'bg-amber-400' : 'bg-[#7eda95]'} w-[15%]`}></div>
              </div>
            </div>
          </div>
          <div className={`mt-6 pt-6 border-t ${theme.cardBorder} flex items-center justify-between text-[#becabd]`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSuperAdmin ? 'bg-amber-400' : 'bg-[#7eda95]'} animate-pulse`}></span>
              <span className="text-[12px]">All systems operational</span>
            </div>
            <button className={`text-[12px] ${isSuperAdmin ? 'hover:text-amber-400' : 'hover:text-[#7eda95]'} underline`}>Logs</button>
          </div>
        </div>

        {/* Subject Popularity Bar Chart */}
        <div className={`col-span-12 lg:col-span-4 ${theme.cardBg} border ${theme.cardBorder} rounded-xl p-6`}>
          <h3 className="text-lg font-bold text-[#dae2fd] mb-6">{isSuperAdmin ? 'Subject Popularity' : 'Top Subjects'}</h3>
          <div className="space-y-4">
            {subjects.length > 0 ? subjects.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-20 text-[10px] font-semibold text-[#becabd] uppercase truncate">{item.subject}</span>
                <div className="flex-1 h-3 bg-[#060e20] rounded-sm overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, parseInt(item.count) / 5)}%` }}
                    transition={{ delay: i * 0.1 }}
                    className={`h-full ${isSuperAdmin ? 'bg-amber-400' : 'bg-[#7eda95]'}`}
                  />
                </div>
                <span className="text-[10px] text-[#becabd]">{item.count}</span>
              </div>
            )) : (
              <p className="text-sm text-[#becabd]">No data available</p>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className={`col-span-12 lg:col-span-8 ${theme.cardBg} border ${theme.cardBorder} rounded-xl p-6 overflow-hidden`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#dae2fd]">Recent Activity</h3>
            <button className={`text-xs font-semibold hover:underline uppercase tracking-wider ${isSuperAdmin ? 'text-amber-400' : 'text-[#7eda95]'}`}>View History</button>
          </div>
          <div className="space-y-0 divide-y divide-[#3f4940]">
            {activities.length > 0 ? activities.slice(0, 6).map((activity, i) => (
              <div key={i} className="py-4 flex items-center justify-between hover:bg-[#222a3d] transition-colors group px-2 -mx-2 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.type === 'user_created' ? (isSuperAdmin ? 'bg-amber-900/20 text-amber-400' : 'bg-[#47a263]/20 text-[#7eda95]') : 'bg-[#3a4a5f]/20 text-[#b7c8e1]'
                  }`}>
                    {activity.type === 'user_created' ? <Users className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm text-[#dae2fd]">{activity.title}</p>
                    <p className="text-[12px] text-[#becabd]">{activity.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-[#becabd]">{new Date(activity.timestamp).toLocaleDateString()}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    activity.type === 'user_created' ? (isSuperAdmin ? 'text-amber-400 bg-amber-900/20' : 'text-[#7eda95] bg-[#7eda95]/10') : 'text-[#b7c8e1] bg-[#b7c8e1]/10'
                  }`}>
                    {activity.type === 'user_created' ? 'New User' : 'Activity'}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[#becabd] py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Legacy Students Alert */}
      {stats?.legacyStudents && stats.legacyStudents > 0 && (
        <section className="bg-gradient-to-r from-[#171f33] to-[#222a3d] border border-[#3f4940] rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-3">
            <span className="bg-[#89ceff]/20 text-[#89ceff] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Action Required</span>
            <h2 className="text-lg font-bold text-[#dae2fd]">{stats.legacyStudents} Legacy Students Need Grade Assignment</h2>
            <p className="text-sm text-[#becabd]">These student accounts were created before grade-level filtering was introduced. Assign grades to enable personalized content delivery.</p>
            <a href="/admin/users" className={`px-6 py-3 text-xs font-bold rounded-lg hover:scale-[0.98] transition-transform inline-block uppercase tracking-wider ${isSuperAdmin ? 'bg-amber-500 text-[#0f1729]' : 'bg-[#47a263] text-[#003919]'}`}>
              Manage Legacy Students
            </a>
          </div>
          <div className="relative w-full md:w-1/3 aspect-video rounded-xl overflow-hidden border border-[#3f4940] bg-[#060e20] flex items-center justify-center">
            <Users className={`w-16 h-16 ${isSuperAdmin ? 'text-amber-400/30' : 'text-[#7eda95]/30'}`} />
          </div>
        </section>
      )}

      {/* Users by Grade Distribution */}
      <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl p-6`}>
        <h3 className="text-lg font-bold text-[#dae2fd] mb-6">Students by Grade Level</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {stats?.usersByGrade?.map((item) => (
            <div key={item.grade} className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold ${isSuperAdmin ? 'text-amber-400' : 'text-[#7eda95]'}`}>{item.count}</p>
              <p className="text-xs text-[#becabd] mt-1 uppercase tracking-wider">Grade {item.grade}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}