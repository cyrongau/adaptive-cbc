'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  BarChart3, TrendingUp, Users, BookOpen, GraduationCap, Award,
  FileText, Sparkles, PieChart, Layers, Loader2, RefreshCw, Calendar,
  ChevronDown,
} from 'lucide-react';

type Tab = 'overview' | 'content' | 'curriculum' | 'quality' | 'ai-usage';

interface ContentMetrics {
  totalQuestions: number;
  byStatus: { drafts: number; pendingReview: number; approved: number; published: number };
  trend: { date: string; count: string }[];
  perSubject: { subject: string; count: string }[];
  perTeacher: { teacher: string; count: string }[];
}

interface CurriculumCoverage {
  coverage: { strand: string; grade: string; questionCount: string }[];
  subStrandCoverage: { subStrand: string; strand: string; questionCount: string }[];
  totalStrands: number;
  coveredStrands: number;
}

interface QualityDistribution {
  difficultySpread: { difficulty: string; count: string }[];
  bloomSpread: { bloom: string; count: string }[];
  typeDistribution: { type: string; count: string }[];
}

interface AiUsage {
  totalAiCalls: number;
  byType: { type: string; count: string }[];
  dailyTrend: { date: string; count: string }[];
  topUsers: { user: string; count: string }[];
}

export default function AdminAnalyticsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [institutionData, setInstitutionData] = useState<any>(null);
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics | null>(null);
  const [curriculumCoverage, setCurriculumCoverage] = useState<CurriculumCoverage | null>(null);
  const [qualityDistribution, setQualityDistribution] = useState<QualityDistribution | null>(null);
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [fetchErrors, setFetchErrors] = useState<Record<string, boolean>>({});

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    fetchAll();
  }, [period]);

  const fetchAll = async () => {
    setLoading(true);
    setTabLoading(true);
    setFetchErrors({});

    const [statsRes, contentRes, curriculumRes, qualityRes, aiRes] = await Promise.allSettled([
      api.get('/analytics/admin/platform-stats'),
      api.get(`/analytics/admin/content-metrics?period=${period}`),
      api.get('/analytics/admin/curriculum-coverage'),
      api.get('/analytics/admin/quality-distribution'),
      api.get(`/analytics/admin/ai-usage?period=${period}`),
    ]);

    if (statsRes.status === 'fulfilled') {
      const data = statsRes.value.data;
      setStats(data);
      if (!isSuperAdmin && data) {
        setInstitutionData({
          totalTeachers: data.teachers || 0,
          totalStudents: data.students || 0,
          activeTeachers: data.teachers || 0,
          activeStudents: data.students || 0,
        });
      }
    } else {
      console.error('Failed to load platform stats:', statsRes.reason);
      toast.error('Failed to load overview analytics');
      setStats({
        totalUsers: 0, totalSessions: 0, averageScore: '0.0',
        totalQuestionsAttempted: 0, monthlyGrowth: [], recentUsers: []
      });
      setFetchErrors(prev => ({ ...prev, overview: true }));
    }

    if (contentRes.status === 'fulfilled') setContentMetrics(contentRes.value.data);
    else {
      console.error('Failed to load content metrics:', contentRes.reason);
      setFetchErrors(prev => ({ ...prev, content: true }));
    }

    if (curriculumRes.status === 'fulfilled') setCurriculumCoverage(curriculumRes.value.data);
    else {
      console.error('Failed to load curriculum coverage:', curriculumRes.reason);
      setFetchErrors(prev => ({ ...prev, curriculum: true }));
    }

    if (qualityRes.status === 'fulfilled') setQualityDistribution(qualityRes.value.data);
    else {
      console.error('Failed to load quality distribution:', qualityRes.reason);
      setFetchErrors(prev => ({ ...prev, quality: true }));
    }

    if (aiRes.status === 'fulfilled') setAiUsage(aiRes.value.data);
    else {
      console.error('Failed to load AI usage:', aiRes.reason);
      setFetchErrors(prev => ({ ...prev, ai: true }));
    }

    setLoading(false);
    setTabLoading(false);
  };

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'content', label: 'Content', icon: FileText },
    { key: 'curriculum', label: 'Curriculum', icon: Layers },
    { key: 'quality', label: 'Quality', icon: PieChart },
    { key: 'ai-usage', label: 'AI Usage', icon: Sparkles },
  ];

  const renderBar = (label: string, value: number, max: number, color: string) => (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs text-[#becabd] w-32 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-3 bg-[#060e20] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
      <span className="text-xs text-[#dae2fd] w-10 text-right font-mono">{value}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">
            {isSuperAdmin ? 'Platform Analytics' : 'Institution Analytics'}
          </h2>
          <p className="text-sm text-[#becabd] mt-1">
            {isSuperAdmin ? 'Detailed platform performance metrics.' : "Overview of your institution's performance."}
          </p>
        </div>
      </div>

      <div className="flex gap-1 bg-[#0f1729] rounded-xl p-1 border border-[#3f4940] overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === key
                ? 'bg-[#7eda95]/20 text-[#7eda95]'
                : 'text-[#becabd] hover:text-[#dae2fd] hover:bg-[#171f33]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
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

          {isSuperAdmin && stats?.monthlyGrowth && (
            <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#dae2fd] mb-6">Monthly User Growth</h3>
              <div className="h-64 flex items-end justify-between gap-1 px-4 pb-4 relative">
                <div className="absolute inset-0 border-b border-l border-[#3f4940] opacity-20"></div>
                {stats.monthlyGrowth.map((item: { month: string; count: string }, i: number) => {
                  const maxCount = Math.max(...stats.monthlyGrowth.map((m: any) => parseInt(m.count)), 1);
                  const height = Math.max(8, (parseInt(item.count) / maxCount) * 100);
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-[#7eda95]/30 hover:bg-[#7eda95]/50 rounded-t transition-all" style={{ height: `${height}%` }} />
                      <span className="text-[9px] text-[#becabd] mt-1 -rotate-45 origin-left whitespace-nowrap">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
        </>
      )}

      {activeTab === 'content' && (tabLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : contentMetrics ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#dae2fd]">Question Bank</h3>
              <div className="flex items-center gap-1 text-xs text-[#becabd]">
                <Calendar className="w-3 h-3" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="bg-transparent border border-[#3f4940] rounded px-2 py-1 text-[#dae2fd] text-xs"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[
                { label: 'Total', value: contentMetrics.totalQuestions, color: 'text-[#b7c8e1]' },
                { label: 'Drafts', value: contentMetrics.byStatus.drafts, color: 'text-[#becabd]' },
                { label: 'Pending', value: contentMetrics.byStatus.pendingReview, color: 'text-[#fbbf24]' },
                { label: 'Published', value: contentMetrics.byStatus.published, color: 'text-[#7eda95]' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-[#becabd]">{s.label}</p>
                </div>
              ))}
            </div>
            {contentMetrics.trend.length > 0 && (
              <>
                <h4 className="text-sm font-semibold text-[#dae2fd] mb-3">Daily Trend</h4>
                <div className="h-40 flex items-end justify-between gap-1">
                  {(() => {
                    const maxCount = Math.max(...contentMetrics.trend.map(t => parseInt(t.count)), 1);
                    return contentMetrics.trend.map((item) => (
                      <div key={item.date} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-[#7eda95]/40 hover:bg-[#7eda95]/60 rounded-t transition-all" style={{ height: `${(parseInt(item.count) / maxCount) * 100}%` }} />
                        <span className="text-[8px] text-[#becabd] mt-1">{item.date.slice(-2)}</span>
                      </div>
                    ));
                  })()}
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
              <h4 className="text-sm font-semibold text-[#dae2fd] mb-3">Questions per Subject</h4>
              {contentMetrics.perSubject.length > 0 ? (
                (() => {
                  const maxCount = Math.max(...contentMetrics.perSubject.map(s => parseInt(s.count)), 1);
                  return contentMetrics.perSubject.slice(0, 10).map(s => renderBar(s.subject, parseInt(s.count), maxCount, 'bg-[#89ceff]'));
                })()
              ) : (
                <p className="text-xs text-[#becabd]">No data</p>
              )}
            </div>
            <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
              <h4 className="text-sm font-semibold text-[#dae2fd] mb-3">Top Contributors</h4>
              {contentMetrics.perTeacher.length > 0 ? (
                (() => {
                  const maxCount = Math.max(...contentMetrics.perTeacher.map(t => parseInt(t.count)), 1);
                  return contentMetrics.perTeacher.slice(0, 10).map(t => renderBar(t.teacher, parseInt(t.count), maxCount, 'bg-[#7eda95]'));
                })()
              ) : (
                <p className="text-xs text-[#becabd]">No data</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 text-center">
          <p className="text-sm text-[#becabd]">Failed to load content metrics.</p>
          <button onClick={fetchAll} className="mt-2 text-xs text-[#7eda95] hover:underline">Retry</button>
        </div>
      ))}

      {activeTab === 'curriculum' && (tabLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : curriculumCoverage ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#dae2fd] mb-4">Strand Coverage</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center bg-[#0f1729] rounded-lg px-4 py-2">
                <p className="text-xl font-bold text-[#7eda95]">{curriculumCoverage.coveredStrands}</p>
                <p className="text-xs text-[#becabd]">Covered</p>
              </div>
              <div className="text-center bg-[#0f1729] rounded-lg px-4 py-2">
                <p className="text-xl font-bold text-[#becabd]">{curriculumCoverage.totalStrands}</p>
                <p className="text-xs text-[#becabd]">Total</p>
              </div>
              <div className="text-center bg-[#0f1729] rounded-lg px-4 py-2">
                <p className="text-xl font-bold text-[#fbbf24]">{Math.round((curriculumCoverage.coveredStrands / Math.max(curriculumCoverage.totalStrands, 1)) * 100)}%</p>
                <p className="text-xs text-[#becabd]">Coverage</p>
              </div>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {curriculumCoverage.coverage.map((item, i) => {
                const maxCount = Math.max(...curriculumCoverage.coverage.map(c => parseInt(c.questionCount)), 1);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-[#dae2fd] w-8">G{item.grade}</span>
                    <div className="flex-1 h-4 bg-[#060e20] rounded overflow-hidden">
                      <div className="h-full bg-[#89ceff]/60 rounded" style={{ width: `${(parseInt(item.questionCount) / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-[#becabd] w-8 text-right">{item.questionCount}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#dae2fd] mb-4">Sub-Strand Detail</h3>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {curriculumCoverage.subStrandCoverage.map((item, i) => {
                const maxCount = Math.max(...curriculumCoverage.subStrandCoverage.map(c => parseInt(c.questionCount)), 1);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[#dae2fd] truncate">{item.subStrand}</span>
                        <span className="text-[#becabd]">{item.questionCount}</span>
                      </div>
                      <div className="h-2 bg-[#060e20] rounded overflow-hidden">
                        <div className="h-full bg-[#7eda95] rounded" style={{ width: `${(parseInt(item.questionCount) / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 text-center">
          <p className="text-sm text-[#becabd]">Failed to load curriculum coverage.</p>
          <button onClick={fetchAll} className="mt-2 text-xs text-[#7eda95] hover:underline">Retry</button>
        </div>
      ))}

      {activeTab === 'quality' && (tabLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : qualityDistribution ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#dae2fd] mb-4">Difficulty Spread</h3>
            {['easy', 'medium', 'hard'].map((d) => {
              const item = qualityDistribution.difficultySpread.find(i => i.difficulty === d);
              const count = item ? parseInt(item.count) : 0;
              const total = qualityDistribution.difficultySpread.reduce((s, i) => s + parseInt(i.count), 0) || 1;
              const colors: Record<string, string> = { easy: 'bg-[#7eda95]', medium: 'bg-[#fbbf24]', hard: 'bg-[#f87171]' };
              return (
                <div key={d} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#dae2fd] capitalize">{d}</span>
                    <span className="text-[#becabd]">{count} ({Math.round((count / total) * 100)}%)</span>
                  </div>
                  <div className="h-3 bg-[#060e20] rounded-full overflow-hidden">
                    <div className={`h-full ${colors[d]} rounded-full`} style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#dae2fd] mb-4">Bloom's Taxonomy</h3>
            {qualityDistribution.bloomSpread.map((item) => {
              const total = qualityDistribution.bloomSpread.reduce((s, i) => s + parseInt(i.count), 0) || 1;
              const pct = Math.round((parseInt(item.count) / total) * 100);
              return (
                <div key={item.bloom} className="mb-2 flex items-center gap-2 text-xs">
                  <span className="text-[#dae2fd] w-20 capitalize truncate">{item.bloom.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-2 bg-[#060e20] rounded-full overflow-hidden">
                    <div className="h-full bg-[#89ceff] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[#becabd] w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#dae2fd] mb-4">Question Types</h3>
            {qualityDistribution.typeDistribution.map((item) => {
              const total = qualityDistribution.typeDistribution.reduce((s, i) => s + parseInt(i.count), 0) || 1;
              return (
                <div key={item.type} className="mb-2 flex items-center gap-2 text-xs">
                  <span className="text-[#dae2fd] w-28 truncate capitalize">{item.type.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-2 bg-[#060e20] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7eda95] rounded-full" style={{ width: `${(parseInt(item.count) / total) * 100}%` }} />
                  </div>
                  <span className="text-[#becabd] w-8 text-right">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 text-center">
          <p className="text-sm text-[#becabd]">Failed to load quality distribution.</p>
          <button onClick={fetchAll} className="mt-2 text-xs text-[#7eda95] hover:underline">Retry</button>
        </div>
      ))}

      {activeTab === 'ai-usage' && (tabLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : aiUsage ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#dae2fd]">AI Usage Summary</h3>
              <div className="flex items-center gap-1 text-xs text-[#becabd]">
                <Calendar className="w-3 h-3" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="bg-transparent border border-[#3f4940] rounded px-2 py-1 text-[#dae2fd] text-xs"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-[#7eda95]">{aiUsage.totalAiCalls.toLocaleString()}</p>
              <p className="text-xs text-[#becabd]">Total AI Calls</p>
            </div>
            <h4 className="text-sm font-semibold text-[#dae2fd] mb-3">By Service Type</h4>
            {aiUsage.byType.length > 0 ? (
              (() => {
                const maxCount = Math.max(...aiUsage.byType.map(t => parseInt(t.count)), 1);
                return aiUsage.byType.map((item) => (
                  <div key={item.type} className="flex items-center gap-2 text-xs mb-2">
                    <span className="text-[#dae2fd] w-28 truncate capitalize">{item.type.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-3 bg-[#060e20] rounded-full overflow-hidden">
                      <div className="h-full bg-[#89ceff] rounded-full" style={{ width: `${(parseInt(item.count) / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-[#becabd] w-10 text-right">{item.count}</span>
                  </div>
                ));
              })()
            ) : (
              <p className="text-xs text-[#becabd]">No AI usage data</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
              <h4 className="text-sm font-semibold text-[#dae2fd] mb-4">Daily AI Call Trend</h4>
              {aiUsage.dailyTrend.length > 0 ? (
                <div className="h-48 flex items-end justify-between gap-1">
                  {(() => {
                    const maxCount = Math.max(...aiUsage.dailyTrend.map(t => parseInt(t.count)), 1);
                    return aiUsage.dailyTrend.map((item) => (
                      <div key={item.date} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-[#7eda95]/40 hover:bg-[#7eda95]/60 rounded-t transition-all" style={{ height: `${(parseInt(item.count) / maxCount) * 100}%` }} />
                        <span className="text-[8px] text-[#becabd] mt-1">{item.date.slice(-2)}</span>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-xs text-[#becabd]">No trend data</p>
              )}
            </div>
            <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6">
              <h4 className="text-sm font-semibold text-[#dae2fd] mb-3">Top AI Users</h4>
              {aiUsage.topUsers.length > 0 ? (
                (() => {
                  const maxCount = Math.max(...aiUsage.topUsers.map(u => parseInt(u.count)), 1);
                  return aiUsage.topUsers.map((item, i) => renderBar(
                    `${item.user.substring(0, 8)}...`,
                    parseInt(item.count),
                    maxCount,
                    i === 0 ? 'bg-[#fbbf24]' : 'bg-[#7eda95]'
                  ));
                })()
              ) : (
                <p className="text-xs text-[#becabd]">No user data</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 text-center">
          <p className="text-sm text-[#becabd]">Failed to load AI usage data.</p>
          <button onClick={fetchAll} className="mt-2 text-xs text-[#7eda95] hover:underline">Retry</button>
        </div>
      ))}
    </div>
  );
}
