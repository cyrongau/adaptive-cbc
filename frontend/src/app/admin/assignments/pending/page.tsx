'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, FileText, Clock, CheckCircle, XCircle, BookOpen, Star, User, Search } from 'lucide-react';

interface PendingAssignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  subStrand: string;
  strand: string;
  grade: number;
  totalPoints: number;
  dueDate: string;
  questionCount: number;
  status: string;
  createdAt: string;
  teacher: { id: string; firstName: string; lastName: string };
}

const TABS = [
  { key: 'pending_approval', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'approved', label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
];

export default function PendingAssignmentsPage() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<PendingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_approval');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPending = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/assignments/pending-approval?status=${status}`);
      setAssignments(res.data || []);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load assignments';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending(activeTab);
  }, [activeTab, fetchPending]);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/assignments/${id}/approve`);
      toast.success('Assignment approved');
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to approve';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/assignments/${id}/reject`);
      toast.success('Assignment rejected');
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to reject';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const filtered = assignments.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.subject.toLowerCase().includes(q) ||
      a.teacher?.firstName?.toLowerCase().includes(q) ||
      a.teacher?.lastName?.toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string) => {
    const tab = TABS.find((t) => t.key === status);
    if (!tab) return null;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${tab.color}`}>
        {tab.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Assignment Review</h1>
        <p className="text-sm text-[#becabd] mt-1">Review, approve, or reject assignments submitted by teachers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#171f33] rounded-xl p-1.5 border border-[#3f4940] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[#7eda95] text-[#0f1729] shadow-md'
                : 'text-[#becabd] hover:text-[#dae2fd] hover:bg-[#222a3d]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
        <input
          type="text"
          placeholder="Search by title, subject, or teacher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#171f33] border border-[#3f4940] rounded-xl py-2.5 pl-10 pr-4 text-[#dae2fd] text-sm focus:border-[#7eda95] focus:ring-0 outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 text-[#3f4940] mx-auto mb-4" />
          <p className="text-[#becabd] text-lg">
            No {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} assignments found.
          </p>
        </div>
      ) : (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#3f4940]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#8f9e8f] uppercase tracking-wider">Title</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#8f9e8f] uppercase tracking-wider">Teacher</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#8f9e8f] uppercase tracking-wider">Subject</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#8f9e8f] uppercase tracking-wider">Grade</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#8f9e8f] uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#8f9e8f] uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-[#8f9e8f] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3f4940]">
                {filtered.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-[#1a2540] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#222a3d] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-[#7eda95]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#dae2fd] text-sm">{assignment.title}</p>
                          <p className="text-xs text-[#8f9e8f] mt-0.5">
                            {assignment.questionCount} questions &bull; {assignment.totalPoints} pts
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#becabd] shrink-0" />
                        <span className="text-sm text-[#becabd]">
                          {assignment.teacher?.firstName} {assignment.teacher?.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#becabd]">{assignment.subject}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#becabd]">Grade {assignment.grade}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8f9e8f]">
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{statusBadge(assignment.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {assignment.status === 'pending_approval' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(assignment.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(assignment.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8f9e8f] italic">
                          {assignment.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
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
