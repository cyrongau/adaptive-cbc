'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Eye,
  MessageSquare,
  Loader2,
} from 'lucide-react';

interface KycApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  kycStatus: string;
  institutionApplication: {
    institutionName: string;
    institutionType: string;
    county: string;
    address: string;
    phone: string;
    submittedAt: string;
  };
  createdAt: string;
}

export default function AdminKycApplicationsPage() {
  const [applications, setApplications] = useState<KycApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<KycApplication | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/users/kyc/pending');
      setApplications(response.data);
    } catch (error) {
      toast.error('Failed to fetch KYC applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      await api.post(`/users/${id}/kyc/approve`);
      toast.success('Application approved successfully!');
      fetchApplications();
      setSelectedApp(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setProcessing(true);
    try {
      await api.post(`/users/${selectedApp!.id}/kyc/reject`, { reason: rejectReason });
      toast.success('Application rejected');
      setShowRejectModal(false);
      setRejectReason('');
      fetchApplications();
      setSelectedApp(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject application');
    } finally {
      setProcessing(false);
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#dae2fd]">KYC Applications</h2>
        <p className="text-sm text-[#becabd] mt-1">Review and approve institution admin applications.</p>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-12 text-center">
          <Shield className="w-12 h-12 text-[#3f4940] mx-auto mb-4" />
          <p className="text-sm text-[#becabd]">No pending KYC applications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Cards */}
          <div className="lg:col-span-2 space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`bg-[#171f33] border rounded-xl p-6 cursor-pointer transition-all ${
                  selectedApp?.id === app.id ? 'border-[#7eda95]' : 'border-[#3f4940] hover:border-[#7eda95]/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#2d3449] rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-[#7eda95]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#dae2fd]">{app.firstName} {app.lastName}</h3>
                      <p className="text-xs text-[#becabd]">{app.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-400/10 text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-[#3f4940] grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-[#becabd]">
                    <Building2 className="w-4 h-4" />
                    {app.institutionApplication?.institutionName}
                  </div>
                  <div className="flex items-center gap-2 text-[#becandt]">
                    <MapPin className="w-4 h-4" />
                    {app.institutionApplication?.county}
                  </div>
                </div>
                
                <p className="text-xs text-[#becabd] mt-3">
                  Submitted: {new Date(app.institutionApplication?.submittedAt || app.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* Application Details Panel */}
          <div className="lg:col-span-1">
            {selectedApp ? (
              <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 sticky top-24">
                <h3 className="text-lg font-bold text-[#dae2fd] mb-6">Application Details</h3>
                
                <div className="space-y-4">
                  {/* Applicant Info */}
                  <div className="p-4 bg-[#060e20] rounded-lg">
                    <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Applicant</p>
                    <p className="text-sm text-[#dae2fd] font-semibold">{selectedApp.firstName} {selectedApp.lastName}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#becabd]">
                      <Mail className="w-3 h-3" />
                      {selectedApp.email}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#becabd]">
                      <Phone className="w-3 h-3" />
                      {selectedApp.phone}
                    </div>
                  </div>

                  {/* Institution Info */}
                  <div className="p-4 bg-[#060e20] rounded-lg">
                    <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Institution</p>
                    <p className="text-sm text-[#dae2fd] font-semibold">{selectedApp.institutionApplication?.institutionName}</p>
                    <p className="text-xs text-[#becabd] capitalize mt-1">{selectedApp.institutionApplication?.institutionType.replace('_', ' ')}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#becabd]">
                      <MapPin className="w-3 h-3" />
                      {selectedApp.institutionApplication?.county}
                    </div>
                    {selectedApp.institutionApplication?.address && (
                      <p className="text-xs text-[#becabd] mt-1">{selectedApp.institutionApplication.address}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(selectedApp.id)}
                      disabled={processing}
                      className="flex-1 px-4 py-2.5 bg-[#47a263] text-[#003919] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => { setShowRejectModal(true); setRejectReason(''); }}
                      disabled={processing}
                      className="flex-1 px-4 py-2.5 border border-[#ffb4ab] text-[#ffb4ab] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#ffb4ab]/10 transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-12 text-center">
                <Eye className="w-12 h-12 text-[#3f4940] mx-auto mb-4" />
                <p className="text-sm text-[#becabd]">Select an application to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-[#3f4940]">
              <h3 className="text-lg font-bold text-[#dae2fd]">Reject Application</h3>
              <p className="text-sm text-[#becabd] mt-1">Provide a reason for rejection</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                  Rejection Reason *
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-[#becabd]" />
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={4}
                    className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#ffb4ab] outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#3f4940] text-[#dae2fd] text-sm font-semibold rounded-lg hover:bg-[#2d3449] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 px-4 py-2.5 bg-[#ffb4ab]/10 text-[#ffb4ab] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#ffb4ab]/20 transition-all disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
