'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { UserPlus, CheckCircle, XCircle, Loader2, ShieldAlert, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface EnrollmentRequest {
  id: string;
  studentId: string;
  studentFullName: string;
  admissionNumber: string;
  status: string;
  createdAt: string;
  rejectionReason?: string;
}

export default function EnrollmentManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollAdmission, setEnrollAdmission] = useState('');
  const [enrollGrade, setEnrollGrade] = useState('');
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  useEffect(() => {
    if (user?.role !== 'institution_admin' && user?.role !== 'super_admin') {
      router.push('/login');
      return;
    }
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students/pending-enrollment');
      setRequests(res.data || []);
    } catch {
      toast.error('Failed to load enrollment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      await api.post('/students/enrollment/review', { requestId, action });
      toast.success(`Request ${action} successfully`);
      loadRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} request`);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentId.trim() || !enrollAdmission.trim()) {
      toast.error('Student ID and Admission Number are required');
      return;
    }
    try {
      await api.post('/students/enroll', {
        studentId: enrollStudentId.trim(),
        admissionNumber: enrollAdmission.trim(),
        grade: enrollGrade ? parseInt(enrollGrade) : undefined,
      });
      toast.success('Student enrolled successfully!');
      setShowEnrollForm(false);
      setEnrollStudentId('');
      setEnrollAdmission('');
      setEnrollGrade('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enroll student');
    }
  };

  const filtered = requests.filter((r) =>
    r.studentFullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-low flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-low p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Student Enrollment</h1>
          <p className="text-sm text-gray-500 mt-1">Manage enrollment requests and enroll students</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadRequests} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => setShowEnrollForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/95 transition-colors">
            <UserPlus className="w-4 h-4" /> Enroll Student
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or admission..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Enrollment Requests */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        <div className="p-6">
          <h2 className="font-extrabold text-gray-900">Pending Requests ({filtered.length})</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-semibold">No pending enrollment requests</p>
          </div>
        ) : (
          filtered.map((req) => (
            <div key={req.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{req.studentFullName}</p>
                  <p className="text-xs text-gray-500">
                    Admission: {req.admissionNumber} &bull; {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReview(req.id, 'approved')}
                  className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => handleReview(req.id, 'rejected')}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Enroll Student Modal */}
      {showEnrollForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-extrabold text-gray-900">Enroll Student</h3>
            <p className="text-sm text-gray-500">Enter the student's ID and assign an admission number.</p>
            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Student User ID</label>
                <input value={enrollStudentId} onChange={(e) => setEnrollStudentId(e.target.value)}
                  placeholder="UUID"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Admission Number</label>
                <input value={enrollAdmission} onChange={(e) => setEnrollAdmission(e.target.value)}
                  placeholder="e.g. ADM-2024-001"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Grade (optional)</label>
                <input value={enrollGrade} onChange={(e) => setEnrollGrade(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 7"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEnrollForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/95">Enroll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
