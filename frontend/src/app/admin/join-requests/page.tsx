'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  Loader2,
  UserPlus,
  Clock,
} from 'lucide-react';

interface JoinRequest {
  id: string;
  studentFullName: string;
  admissionNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  studentId: string;
  institutionId: string;
}

export default function JoinRequestsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const institutionId = user?.institutionId;

  useEffect(() => {
    if (institutionId) {
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [institutionId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const response = await api.get(`/institutions/${institutionId}/join-requests`);
      setRequests(response.data);
    } catch (error: any) {
      console.error('Failed to fetch join requests:', error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      setReviewing(requestId);
      await api.post(`/institutions/join-requests/${requestId}/review`, { action });
      toast.success(`Request ${action}`);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setReviewing(null);
    }
  };

  const totalRequests = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  if (!institutionId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">Join Requests</h2>
          <p className="text-sm text-[#becabd] mt-1">No institution assigned. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#dae2fd]">Join Requests</h2>
        <p className="text-sm text-[#becabd] mt-1">Review and manage student requests to join your institution.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-4">
          <p className="text-xs text-[#becabd] uppercase tracking-wider">Total Requests</p>
          <p className="text-2xl font-bold text-[#dae2fd] mt-1">{totalRequests}</p>
        </div>
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-4">
          <p className="text-xs text-[#becabd] uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-4">
          <p className="text-xs text-[#becabd] uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-bold text-[#7eda95] mt-1">{approvedCount}</p>
        </div>
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-4">
          <p className="text-xs text-[#becabd] uppercase tracking-wider">Rejected</p>
          <p className="text-2xl font-bold text-[#ffb4ab] mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3f4940]">
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Student Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Admission No.</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Date</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3f4940]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#becabd]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading join requests...
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <XCircle className="w-12 h-12 text-red-400/50 mx-auto mb-3" />
                    <p className="text-[#becabd] text-sm mb-2">Failed to load join requests</p>
                    <button
                      onClick={fetchRequests}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#47a263] hover:bg-[#3d8f58] rounded-lg transition-colors"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <UserPlus className="w-12 h-12 text-[#becabd]/30 mx-auto mb-3" />
                    <p className="text-[#becabd] text-sm">No join requests yet</p>
                    <p className="text-[#becabd]/60 text-xs mt-1">Student requests will appear here when submitted</p>
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-[#222a3d] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#47a263]/20 flex items-center justify-center text-xs font-bold text-[#7eda95]">
                          {request.studentFullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '?'}
                        </div>
                        <span className="text-sm text-[#dae2fd] font-medium">{request.studentFullName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#dae2fd] font-mono">{request.admissionNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          request.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400'
                            : request.status === 'approved'
                            ? 'bg-[#7eda95]/10 text-[#7eda95]'
                            : 'bg-[#ffb4ab]/10 text-[#ffb4ab]'
                        }`}
                      >
                        {request.status === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#becabd]">
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {request.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReview(request.id, 'approved')}
                            disabled={reviewing === request.id}
                            className="p-2 text-[#7eda95] hover:bg-[#7eda95]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approve"
                          >
                            {reviewing === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReview(request.id, 'rejected')}
                            disabled={reviewing === request.id}
                            className="p-2 text-[#ffb4ab] hover:bg-[#93000a]/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reject"
                          >
                            {reviewing === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#becabd]/60">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
