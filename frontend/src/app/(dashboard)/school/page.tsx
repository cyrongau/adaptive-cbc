'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Building2, Search, Users, Upload, Plus, CheckCircle, XCircle, Clock, FileText, X, MapPin, GraduationCap } from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  county: string;
  motto?: string;
  address?: string;
  logo?: string;
  totalStudents: number;
  totalTeachers: number;
}

interface JoinRequest {
  id: string;
  studentId: string;
  studentFullName: string;
  admissionNumber: string;
  status: string;
  createdAt: string;
}

interface StudentJoinRequest {
  id: string;
  institutionId: string;
  institution?: { id: string; name: string };
  status: string;
  createdAt: string;
}

interface SchoolEnrollment {
  institution: Institution;
  enrollment: {
    admissionNumber: string;
    grade: number;
    stream?: string;
  };
  teachers: {
    id: string;
    teacherId: string;
    subjects: string[];
    streams: string[];
    isActive: boolean;
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      avatar?: string;
    } | null;
  }[];
}

export default function SchoolPage() {
  const { user } = useAuthStore();
  const [myInstitution, setMyInstitution] = useState<Institution | null>(null);
  const [schoolEnrollment, setSchoolEnrollment] = useState<SchoolEnrollment | null>(null);
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [schoolError, setSchoolError] = useState(false);
  const [studentJoinRequest, setStudentJoinRequest] = useState<StudentJoinRequest | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [adminJoinRequests, setAdminJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [createData, setCreateData] = useState({ name: '', code: '', type: 'basic_education', county: '', description: '', motto: '' });
  const [joinData, setJoinData] = useState({ fullName: `${user?.firstName || ''} ${user?.lastName || ''}`, admissionNumber: '' });
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'institution_admin' || user?.role === 'super_admin';

  useEffect(() => {
    fetchData();
  }, [user?.institutionId]);

  const fetchSchoolInfo = async () => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser?.role !== 'student') return;
    setLoadingSchool(true);
    setSchoolError(false);
    try {
      if (currentUser?.institutionId) {
        const res = await api.get('/institutions/my-school');
        if (res.data) {
          setSchoolEnrollment(res.data);
          return;
        }
      }
      const myRequests = await api.get('/institutions/my-join-requests').catch(() => null);
      const pending = myRequests?.data?.find((r: StudentJoinRequest) => r.status === 'pending');
      if (pending) {
        setStudentJoinRequest(pending);
      } else {
        setSchoolError(true);
      }
    } catch {
      setSchoolError(true);
    } finally {
      setLoadingSchool(false);
    }
  };

  const fetchData = async () => {
    const currentUser = useAuthStore.getState().user;
    const isStu = currentUser?.role === 'student';
    try {
      if (isTeacher) {
        /* Teachers only view their school profile — no management actions */
        const instResponse = await api.get('/institutions/my').catch(() => null);
        if (instResponse) {
          setMyInstitution(instResponse.data);
        }
      }
      if (isAdmin) {
        const instResponse = await api.get('/institutions/my').catch(() => null);
        if (instResponse) {
          setMyInstitution(instResponse.data);
          const requestsResponse = await api.get(`/institutions/${instResponse.data.id}/join-requests`);
          setAdminJoinRequests(requestsResponse.data);
        }
      }
      if (isStu) {
        await fetchSchoolInfo();
        if (!currentUser?.institutionId) {
          const allResponse = await api.get('/institutions');
          setInstitutions(allResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/institutions', { ...createData, grades: [1,2,3,4,5,6,7,8,9] });
      toast.success('School profile created successfully!');
      setShowCreateModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create school');
    }
  };

  const handleJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitution) return;
    try {
      const response = await api.post(`/institutions/${selectedInstitution.id}/join-request`, joinData);
      const { verified, message, institution } = response.data;

      if (verified) {
        toast.success(message);
        setShowJoinModal(false);
        setJoinData({ fullName: joinData.fullName, admissionNumber: '' });
        await useAuthStore.getState().refreshUser();
        fetchData();
      } else {
        toast.error(message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    }
  };

  const handleReviewRequest = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      await api.post(`/institutions/join-requests/${requestId}/review`, { action });
      toast.success(`Request ${action}!`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to review request');
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !myInstitution) return;
    const text = await csvFile.text();
    const lines = text.split('\n').filter(l => l.trim());
    const students = lines.slice(1).map(line => {
      const [fullName, admissionNumber, grade, stream] = line.split(',').map(s => s.trim());
      return { fullName, admissionNumber, grade: grade ? parseInt(grade) : undefined, stream };
    }).filter(s => s.fullName && s.admissionNumber);

    try {
      const response = await api.post(`/institutions/${myInstitution.id}/bulk-students`, { students });
      toast.success(`Uploaded: ${response.data.successCount} successful, ${response.data.errorCount} failed`);
      setCsvFile(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload CSV');
    }
  };

  const filteredInstitutions = institutions.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.county?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" />
          {isStudent ? 'Find Your School' : isTeacher ? 'School Details' : 'School Management'}
        </h1>
        <p className="text-slate-500 mt-1">
          {isStudent ? 'Search and join your school to access school-specific content' : isTeacher ? 'View your school profile and information' : 'Manage your school profile and students'}
        </p>
      </div>

      {/* Teacher View — School Details Only */}
      {isTeacher && (
        <>
          {myInstitution ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                    {myInstitution.logo ? (
                      <img src={myInstitution.logo} alt={myInstitution.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Building2 className="w-8 h-8 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{myInstitution.name}</h2>
                    <p className="text-sm text-slate-500">{myInstitution.type.replace('_', ' ')} • {myInstitution.county}</p>
                    <p className="text-xs text-slate-400 mt-1">Code: {myInstitution.code}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  myInstitution.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {myInstitution.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{myInstitution.totalStudents}</p>
                  <p className="text-sm text-slate-500">Students</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{myInstitution.totalTeachers}</p>
                  <p className="text-sm text-slate-500">Teachers</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No School Assigned</h3>
              <p className="text-slate-500 max-w-md mx-auto">You are not currently affiliated with a school. Contact your administrator to be assigned.</p>
            </div>
          )}
        </>
      )}

      {/* Admin Section — Full Management */}
      {isAdmin && (
        <>
          {myInstitution ? (
            <>
              {/* School Profile Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                      {myInstitution.logo ? (
                        <img src={myInstitution.logo} alt={myInstitution.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Building2 className="w-8 h-8 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{myInstitution.name}</h2>
                      <p className="text-sm text-slate-500">{myInstitution.type.replace('_', ' ')} • {myInstitution.county}</p>
                      <p className="text-xs text-slate-400 mt-1">Code: {myInstitution.code}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    myInstitution.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {myInstitution.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{myInstitution.totalStudents}</p>
                    <p className="text-sm text-slate-500">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{myInstitution.totalTeachers}</p>
                    <p className="text-sm text-slate-500">Teachers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{adminJoinRequests.filter(r => r.status === 'pending').length}</p>
                    <p className="text-sm text-slate-500">Pending Requests</p>
                  </div>
                </div>
              </div>

              {/* CSV Upload */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  Bulk Upload Students
                </h3>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="flex-1 text-sm"
                  />
                  <button
                    onClick={handleCsvUpload}
                    disabled={!csvFile}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    Upload CSV
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">CSV format: fullName, admissionNumber, grade (optional), stream (optional)</p>
              </div>

              {/* Join Requests */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Student Join Requests
                </h3>
                <div className="space-y-3">
                  {adminJoinRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{request.studentFullName}</p>
                        <p className="text-sm text-slate-500">Admission: {request.admissionNumber}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                          request.status === 'approved' ? 'bg-green-100 text-green-700' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {request.status}
                        </span>
                        {request.status === 'pending' && (
                          <div className="flex gap-1">
                            <button onClick={() => handleReviewRequest(request.id, 'approved')} className="p-1 text-green-600 hover:bg-green-50 rounded">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleReviewRequest(request.id, 'rejected')} className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {adminJoinRequests.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No join requests yet.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No School Profile</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">Create a school profile to manage students, upload records, and handle join requests.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Create School Profile
              </button>
            </div>
          )}
        </>
      )}

      {/* Student Section */}
      {isStudent && (
        <>
          {user?.institutionId ? (
            loadingSchool ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : schoolEnrollment ? (
              <div className="space-y-6">
                {/* School Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{schoolEnrollment.institution.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {schoolEnrollment.institution.county}
                          </span>
                          <span className="text-xs text-slate-400">Code: {schoolEnrollment.institution.code}</span>
                          <span className="text-xs text-slate-400 capitalize">{schoolEnrollment.institution.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-indigo-600">Adm: {schoolEnrollment.enrollment.admissionNumber}</p>
                      <p className="text-xs text-slate-500">Grade {schoolEnrollment.enrollment.grade}{schoolEnrollment.enrollment.stream ? ` ${schoolEnrollment.enrollment.stream}` : ''}</p>
                    </div>
                  </div>

                  {schoolEnrollment.institution.motto && (
                    <p className="text-sm text-slate-600 italic mt-4">"{schoolEnrollment.institution.motto}"</p>
                  )}

                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{schoolEnrollment.institution.totalStudents}</p>
                      <p className="text-sm text-slate-500">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{schoolEnrollment.institution.totalTeachers}</p>
                      <p className="text-sm text-slate-500">Teachers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{schoolEnrollment.teachers.length}</p>
                      <p className="text-sm text-slate-500">On Platform</p>
                    </div>
                  </div>
                </div>

                {/* Teachers List */}
                {schoolEnrollment.teachers.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      Your Teachers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {schoolEnrollment.teachers.map((t) => (
                        <div key={t.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                            {t.teacher?.firstName?.[0]}{t.teacher?.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{t.teacher?.firstName} {t.teacher?.lastName}</p>
                            <p className="text-xs text-slate-500">{t.subjects?.join(', ') || 'Teacher'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : studentJoinRequest ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Join Request Pending</h3>
                <p className="text-slate-500 mb-2 max-w-md mx-auto">
                  Your request to join the school is awaiting approval from the school administration.
                </p>
                <p className="text-sm text-slate-400 mb-6">
                  Submitted on {new Date(studentJoinRequest.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
                <p className="text-xs text-slate-400">
                  Please contact your school admin to approve your request, or
                  check back later.
                </p>
              </div>
            ) : schoolError ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">School data not available</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  We couldn't retrieve your school information. This may happen if your enrollment hasn't been fully processed yet.
                </p>
                <button
                  onClick={fetchSchoolInfo}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                >
                  Retry
                </button>
              </div>
            ) : null
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-700 font-medium">Your details will be instantly verified against the school register upon joining.</p>
                <p className="text-xs text-blue-600 mt-1">Make sure your name and admission number match exactly what is in the school register.</p>
              </div>

              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search schools by name, county..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInstitutions.map((inst) => (
                  <div key={inst.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{inst.name}</h3>
                        <p className="text-sm text-slate-500">{inst.county}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                      <span>{inst.totalStudents} students</span>
                      <span className="capitalize">{inst.type.replace('_', ' ')}</span>
                    </div>
                    <button
                      onClick={() => { setSelectedInstitution(inst); setShowJoinModal(true); }}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                    >
                      Join School
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Create School Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Create School Profile</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInstitution} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                <input type="text" value={createData.name} onChange={(e) => setCreateData({ ...createData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">School Code</label>
                  <input type="text" value={createData.code} onChange={(e) => setCreateData({ ...createData, code: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={createData.type} onChange={(e) => setCreateData({ ...createData, type: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl">
                    <option value="basic_education">Category A: Basic Education (Pre-Primary - JSS)</option>
                    <option value="senior_secondary">Category B: Senior Secondary (Grades 10-12)</option>
                    <option value="academy">Academy</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">County</label>
                <input type="text" value={createData.county} onChange={(e) => setCreateData({ ...createData, county: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motto (Optional)</label>
                <input type="text" value={createData.motto} onChange={(e) => setCreateData({ ...createData, motto: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Create School</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join School Modal */}
      {showJoinModal && selectedInstitution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Join {selectedInstitution.name}</h2>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleJoinRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" value={joinData.fullName} onChange={(e) => setJoinData({ ...joinData, fullName: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admission Number</label>
                <input type="text" value={joinData.admissionNumber} onChange={(e) => setJoinData({ ...joinData, admissionNumber: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" placeholder="e.g., ADM-2024-001" required />
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                Your name and admission number will be instantly verified against the school register. If matched, you'll be added immediately.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowJoinModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}