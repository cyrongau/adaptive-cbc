'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Smartphone,
  CheckCircle,
  XCircle,
  Loader2,
  ShieldAlert,
  Clock,
} from 'lucide-react';

interface PendingApproval {
  id: string;
  deviceId: string;
  userId: string;
  studentName: string;
  studentGrade: number | null;
  fingerprint: string;
  browserSignature: string | null;
  osSignature: string | null;
  riskScore: number;
  riskLevel: string;
  createdAt: string;
  lastLoginAt: string;
}

export default function ApprovalsPage() {
  const { user } = useAuthStore();
  const isParent = user?.role === 'parent';
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (isParent) {
      fetchApprovals();
    } else {
      setLoading(false);
    }
  }, [isParent]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/pending-approvals');
      setApprovals(res.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      console.error('Approvals fetch error:', msg, err.response?.status);
      toast.error(`Failed to load approval requests: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId: string, deviceId: string) => {
    setApprovingId(deviceId);
    try {
      await api.post('/students/approve-device', { studentId, deviceId });
      toast.success('Device approved successfully');
      setApprovals(prev => prev.filter(a => a.deviceId !== deviceId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve device');
    } finally {
      setApprovingId(null);
    }
  };

  if (!isParent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Device Approvals</h1>
          <p className="text-slate-500 mt-1">Review and manage device approval requests</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">This section is for parents only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Device Approvals</h1>
        <p className="text-slate-500 mt-1">Review and respond to device approval requests from your children</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-slate-500">Loading requests...</span>
        </div>
      ) : approvals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No Pending Requests</h3>
          <p className="text-slate-500 mt-2">Your children haven't requested any new device approvals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div key={approval.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{approval.studentName}</h3>
                    <p className="text-sm text-slate-500">
                      {approval.studentGrade ? `Grade ${approval.studentGrade} • ` : ''}
                      Device: <span className="font-mono text-xs">{approval.deviceId.slice(0, 8)}...</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Risk Score</p>
                  <p className="text-slate-700 font-semibold">{approval.riskScore}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Risk Level</p>
                  <p className="text-slate-700 font-semibold capitalize">{approval.riskLevel}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Browser</p>
                  <p className="text-slate-700 font-semibold truncate">{approval.browserSignature || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">OS</p>
                  <p className="text-slate-700 font-semibold truncate">{approval.osSignature || 'N/A'}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => handleApprove(approval.userId, approval.deviceId)}
                  disabled={approvingId === approval.deviceId}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {approvingId === approval.deviceId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approve Device
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
