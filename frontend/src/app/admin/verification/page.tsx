'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';

interface KycApplication {
  id: string;
  userId: string;
  role: string;
  fullName: string;
  idNumber?: string;
  tscNumber?: string;
  qualifications?: string;
  experience?: string;
  status: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
}

export default function AdminVerificationPage() {
  const [applications, setApplications] = useState<KycApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<KycApplication | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      const url = filter === 'all' ? '/kyc' : `/kyc?status=${filter}`;
      const response = await api.get(url);
      setApplications(response.data);
    } catch (error) {
      toast.error('Failed to fetch KYC applications');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedApp) return;
    try {
      await api.patch(`/kyc/${selectedApp.id}/review`, {
        action: reviewAction,
        rejectionReason: reviewAction === 'rejected' ? reviewReason : undefined,
        notes: reviewNotes,
      });
      toast.success(`Application ${reviewAction} successfully!`);
      setShowReviewModal(false);
      setSelectedApp(null);
      setReviewReason('');
      setReviewNotes('');
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to review application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-[#7eda95]/10 text-[#7eda95]';
      case 'rejected': return 'bg-[#ffb4ab]/10 text-[#ffb4ab]';
      case 'under_review': return 'bg-[#89ceff]/10 text-[#89ceff]';
      default: return 'bg-[#becabd]/10 text-[#becabd]';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">KYC Verification</h2>
          <p className="text-sm text-[#becabd] mt-1">Review and approve teacher/tutor credentials.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'under_review', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${filter === f ? 'bg-[#7eda95] text-[#003919]' : 'bg-[#171f33] border border-[#3f4940] text-[#becabd] hover:bg-[#2d3449]'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#131b2e] border-b border-[#3f4940]">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Applicant</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">TSC Number</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Submitted</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3f4940]">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-[#222a3d] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2d3449] rounded-full flex items-center justify-center font-bold text-sm text-[#dae2fd]">{app.fullName.split(' ').map(n => n[0]).join('')}</div>
                    <div><p className="text-sm font-semibold text-[#dae2fd]">{app.fullName}</p><p className="text-xs text-[#becabd]">{app.idNumber || 'No ID'}</p></div>
                  </div>
                </td>
                <td className="px-6 py-4"><span className="capitalize text-sm text-[#becabd]">{app.role}</span></td>
                <td className="px-6 py-4 text-sm text-[#becabd]">{app.tscNumber || '-'}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(app.status)}`}>{app.status.replace('_', ' ')}</span></td>
                <td className="px-6 py-4 text-sm text-[#becabd]">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button onClick={() => { setSelectedApp(app); setShowReviewModal(true); }} className="text-xs text-[#7eda95] font-semibold hover:underline uppercase tracking-wider flex items-center gap-1"><Eye className="w-3 h-3" /> Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {applications.length === 0 && <div className="p-12 text-center"><Shield className="w-12 h-12 text-[#3f4940] mx-auto mb-4" /><p className="text-sm text-[#becabd]">No applications found.</p></div>}
      </div>

      {showReviewModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#dae2fd]">Review Application</h2>
              <button onClick={() => setShowReviewModal(false)} className="text-[#becabd] hover:text-[#dae2fd]">Close</button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4 space-y-2">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedApp.fullName}</p>
              <p className="text-xs text-[#becabd] capitalize">{selectedApp.role} • Submitted {new Date(selectedApp.createdAt).toLocaleDateString()}</p>
              {selectedApp.tscNumber && <p className="text-xs text-[#becabd]">TSC: {selectedApp.tscNumber}</p>}
              {selectedApp.qualifications && <p className="text-xs text-[#becabd]">Qualifications: {selectedApp.qualifications}</p>}
              {selectedApp.experience && <p className="text-xs text-[#becabd]">Experience: {selectedApp.experience}</p>}
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Decision</label>
                <div className="flex gap-3">
                  <button onClick={() => setReviewAction('approved')} className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${reviewAction === 'approved' ? 'bg-[#7eda95] text-[#003919]' : 'bg-[#060e20] border border-[#3f4940] text-[#becabd]'}`}><CheckCircle className="w-4 h-4" /> Approve</button>
                  <button onClick={() => setReviewAction('rejected')} className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${reviewAction === 'rejected' ? 'bg-[#ffb4ab] text-[#690005]' : 'bg-[#060e20] border border-[#3f4940] text-[#becabd]'}`}><XCircle className="w-4 h-4" /> Reject</button>
                </div>
              </div>
              {reviewAction === 'rejected' && <div><label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Rejection Reason</label><textarea value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#ffb4ab] outline-none" rows={2} required /></div>}
              <div><label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Notes (Optional)</label><textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" rows={2} /></div>
              <button onClick={handleReview} className={`w-full py-3 rounded-lg font-semibold text-sm ${reviewAction === 'approved' ? 'bg-[#7eda95] text-[#003919]' : 'bg-[#ffb4ab] text-[#690005]'}`}>{reviewAction === 'approved' ? 'Approve Application' : 'Reject Application'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}