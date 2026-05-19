'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Shield, Upload, FileText, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';

interface KycApplication {
  id: string;
  role: string;
  fullName: string;
  idNumber?: string;
  tscNumber?: string;
  qualifications?: string;
  experience?: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function KycPage() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<KycApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    role: user?.role === 'teacher' ? 'teacher' : 'tutor',
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`,
    idNumber: '',
    tscNumber: '',
    qualifications: '',
    experience: '',
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/kyc/my-applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch KYC applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/kyc/submit', formData);
      toast.success('KYC application submitted successfully!');
      setShowForm(false);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'under_review': return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'under_review': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const isApproved = applications.some(a => a.status === 'approved');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Identity Verification
          </h1>
          <p className="text-slate-500 mt-1">Submit your credentials for platform verification</p>
        </div>
        {!isApproved && applications.filter(a => a.status === 'pending').length === 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
          >
            <Upload className="w-5 h-5" />
            Submit Application
          </button>
        )}
      </div>

      {isApproved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">You are verified!</p>
            <p className="text-sm text-green-600">Your credentials have been approved. You have full access to all platform features.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(app.status)}
                <div>
                  <p className="font-semibold text-slate-900">{app.fullName}</p>
                  <p className="text-sm text-slate-500 capitalize">{app.role} • Submitted {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(app.status)}`}>
                {app.status.replace('_', ' ')}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-slate-500">ID Number</p><p className="font-medium text-slate-900">{app.idNumber || '-'}</p></div>
              <div><p className="text-slate-500">TSC Number</p><p className="font-medium text-slate-900">{app.tscNumber || '-'}</p></div>
              <div><p className="text-slate-500">Qualifications</p><p className="font-medium text-slate-900">{app.qualifications || '-'}</p></div>
              <div><p className="text-slate-500">Experience</p><p className="font-medium text-slate-900">{app.experience || '-'}</p></div>
            </div>
            {app.rejectionReason && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium">Rejection Reason: {app.rejectionReason}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No KYC applications submitted yet.</p>
          <button onClick={() => setShowForm(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Submit Your First Application</button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">KYC Application</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label><input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">ID Number</label><input type="text" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">TSC Number</label><input type="text" value={formData.tscNumber} onChange={(e) => setFormData({ ...formData, tscNumber: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Qualifications</label><textarea value={formData.qualifications} onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" rows={2} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Teaching Experience</label><textarea value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" rows={2} /></div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center"><Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm text-slate-500">Upload ID document, certificates, and photo</p></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}