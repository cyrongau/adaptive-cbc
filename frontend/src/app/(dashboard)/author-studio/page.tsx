'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  FileText,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Filter,
  BarChart,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';

interface QuestionSummary {
  id: string;
  content: string;
  type: string;
  grade: number;
  subjectId: string;
  status: string;
  difficulty: string;
  createdAt: string;
  topic?: { name: string };
}

interface Stats {
  drafts: number;
  pendingReview: number;
  approved: number;
  published: number;
  flagged: number;
  total: number;
}

export default function AuthorStudioDashboard() {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, questionsRes] = await Promise.all([
        api.get('/questions/stats'),
        api.get('/questions', {
          params: { createdBy: user?.id, limit: 10, page: 1 },
        }),
      ]);
      setStats(statsRes.data);
      setQuestions(questionsRes.data.questions || []);
    } catch {
      setStats(null);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      draft: 'text-blue-600 bg-blue-50',
      pending_review: 'text-amber-600 bg-amber-50',
      approved: 'text-green-600 bg-green-50',
      published: 'text-[#47a263] bg-[#47a263]/10',
      flagged: 'text-red-600 bg-red-50',
      archived: 'text-slate-500 bg-slate-100',
    };
    return map[status] || 'text-slate-500 bg-slate-100';
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      approved: 'Approved',
      published: 'Published',
      flagged: 'Flagged',
      archived: 'Archived',
    };
    return map[status] || status;
  };

  const statCards = stats
    ? [
        { label: 'My Drafts', value: stats.drafts, icon: FileText, color: 'text-blue-500' },
        { label: 'Pending Review', value: stats.pendingReview, icon: Clock, color: 'text-amber-500' },
        { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-500' },
        { label: 'Published', value: stats.published, icon: BarChart, color: 'text-[#47a263]' },
        { label: 'Flagged', value: stats.flagged, icon: AlertCircle, color: 'text-red-500' },
      ]
    : [];

  const filteredQuestions = questions.filter(q =>
    !searchTerm || q.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Question Author Studio</h1>
          <p className="text-slate-500 mt-1">Create, manage, and track CBC-aligned educational content.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/author-studio/import"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            Import from OCR
          </Link>
          <Link
            href="/author-studio/create"
            className="flex items-center gap-2 px-4 py-2 bg-[#47a263] text-white rounded-lg hover:bg-[#3d8c55] transition-colors font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Question
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4"
            >
              <div className={`p-3 rounded-full bg-slate-50 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Questions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search your questions..."
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/20 focus:border-[#47a263]"
                />
              </div>
              <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </div>
            ) : filteredQuestions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredQuestions.map((q) => (
                  <Link href={`/author-studio/${q.id}`} key={q.id} className="block p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                            Grade {q.grade}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(q.status)}`}>
                            {statusLabel(q.status)}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full capitalize">
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 font-medium line-clamp-2">
                          {q.content.replace(/<[^>]*>?/gm, '')}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 ml-2" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-1">No questions yet</h3>
                <p className="text-sm text-slate-500 mb-4">Start building your question bank by creating your first question.</p>
                <Link
                  href="/author-studio/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#47a263] text-white rounded-lg hover:bg-[#3d8c55] transition-colors font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Question
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-slate-400" />
              Quick Stats
            </h3>
            {stats ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total questions</span>
                  <span className="font-bold text-slate-800">{stats.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">In review</span>
                  <span className="font-bold text-amber-600">{stats.pendingReview}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Approved</span>
                  <span className="font-bold text-green-600">{stats.approved}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Flagged</span>
                  <span className="font-bold text-red-600">{stats.flagged}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No stats available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
