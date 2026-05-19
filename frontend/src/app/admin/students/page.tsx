'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Upload,
  Download,
  Plus,
  Trash2,
  Search,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  GraduationCap,
  Ban,
  RotateCcw,
  MoreVertical,
} from 'lucide-react';

interface StudentRegisterEntry {
  id: string;
  studentName: string;
  grade: number;
  admissionNumber: string;
  stream: string;
  isActive: boolean;
  isSuspended?: boolean;
  deletedAt?: string;
  userId?: string;
  createdAt: string;
}

export default function StudentRegisterPage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<StudentRegisterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newStudent, setNewStudent] = useState({
    studentName: '',
    grade: '',
    admissionNumber: '',
    stream: '',
  });
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRegisterEntry | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const institutionId = user?.institutionId;

  useEffect(() => {
    if (institutionId) {
      fetchStudents();
    }
  }, [institutionId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/institutions/${institutionId}/student-register`);
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to load student register');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.studentName || !newStudent.grade || !newStudent.admissionNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.post(`/institutions/${institutionId}/student-register`, {
        studentName: newStudent.studentName,
        grade: parseInt(newStudent.grade),
        admissionNumber: newStudent.admissionNumber,
        stream: newStudent.stream || undefined,
      });
      toast.success('Student added to register');
      setShowAddModal(false);
      setNewStudent({ studentName: '', grade: '', admissionNumber: '', stream: '' });
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add student');
    }
  };

  const handleRemoveStudent = async (registerId: string) => {
    if (!confirm('Are you sure you want to remove this student from the register?')) return;

    try {
      await api.delete(`/institutions/${institutionId}/student-register/${registerId}`);
      toast.success('Student removed from register');
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove student');
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = 'studentName,grade,admissionNumber,stream\nJohn Doe,7,ADM-2024-001,Blue\nJane Smith,8,ADM-2024-002,Red\nPeter Mwangi,9,ADM-2024-003,Green';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-register-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploading(true);
    setUploadResults(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('student'));
      const gradeIdx = headers.findIndex(h => h.includes('grade'));
      const admIdx = headers.findIndex(h => h.includes('admission') || h.includes('adm'));
      const streamIdx = headers.findIndex(h => h.includes('stream'));

      if (nameIdx === -1 || gradeIdx === -1 || admIdx === -1) {
        toast.error('CSV must have columns: studentName, grade, admissionNumber');
        setUploading(false);
        return;
      }

      const students = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim());
        return {
          studentName: cols[nameIdx],
          grade: parseInt(cols[gradeIdx]),
          admissionNumber: cols[admIdx],
          stream: streamIdx !== -1 ? cols[streamIdx] : undefined,
        };
      }).filter(s => s.studentName && s.grade && s.admissionNumber);

      const response = await api.post(`/institutions/${institutionId}/student-register/bulk`, { students });
      setUploadResults(response.data);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleSuspendStudent = async () => {
    if (!selectedStudent?.userId) return;
    try {
      await api.patch(`/users/${selectedStudent.userId}/suspend`, { reason: suspendReason || undefined });
      toast.success('Student suspended successfully!');
      setShowSuspendModal(false);
      setSuspendReason('');
      setSelectedStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to suspend student');
    }
  };

  const handleUnsuspendStudent = async (student: StudentRegisterEntry) => {
    if (!student.userId) return;
    try {
      await api.patch(`/users/${student.userId}/unsuspend`);
      toast.success('Student unsuspended successfully!');
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unsuspend student');
    }
  };

  const filteredStudents = students.filter(s =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.grade.toString().includes(searchQuery)
  );

  if (!institutionId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">Student Register</h2>
          <p className="text-sm text-[#becabd] mt-1">No institution assigned. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">Student Register</h2>
          <p className="text-sm text-[#becabd] mt-1">Manage your institution's student enrollment records.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadSampleCSV}
            className="px-4 py-2 border border-[#3f4940] text-[#dae2fd] text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-[#2d3449] transition-all uppercase tracking-wider"
          >
            <Download className="w-4 h-4" /> Sample CSV
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 border border-[#3f4940] text-[#dae2fd] text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-[#2d3449] transition-all uppercase tracking-wider"
          >
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#47a263] text-[#003919] text-xs font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
        <input
          type="text"
          placeholder="Search by name, admission number, or grade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#171f33] border border-[#3f4940] rounded-lg py-2.5 pl-10 pr-4 text-[#dae2fd] text-sm focus:border-[#7eda95] focus:ring-0 outline-none"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-4">
          <p className="text-xs text-[#becabd] uppercase tracking-wider">Total Students</p>
          <p className="text-2xl font-bold text-[#7eda95] mt-1">{students.length}</p>
        </div>
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-4">
          <p className="text-xs text-[#becabd] uppercase tracking-wider">Grade 7-9</p>
          <p className="text-2xl font-bold text-[#89ceff] mt-1">{students.filter(s => s.grade >= 7 && s.grade <= 9).length}</p>
        </div>
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-4">
          <p className="text-xs text-[#becabd] uppercase tracking-wider">Grade 10-12</p>
          <p className="text-2xl font-bold text-[#b7c8e1] mt-1">{students.filter(s => s.grade >= 10 && s.grade <= 12).length}</p>
        </div>
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-4">
          <p className="text-xs text-[#becabd] uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-[#7eda95] mt-1">{students.filter(s => s.isActive).length}</p>
        </div>
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-4">
          <p className="text-xs text-[#becabd] uppercase tracking-wider">Joined Platform</p>
          <p className="text-2xl font-bold text-[#7eda95] mt-1">{students.filter(s => s.userId).length}</p>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3f4940]">
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Student Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Grade</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Admission No.</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Stream</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Joined</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-[#becabd] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3f4940]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#becabd]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <GraduationCap className="w-12 h-12 text-[#becabd]/30 mx-auto mb-3" />
                    <p className="text-[#becabd] text-sm">
                      {searchQuery ? 'No students match your search' : 'No students in register yet'}
                    </p>
                    <p className="text-[#becabd]/60 text-xs mt-1">
                      {searchQuery ? 'Try a different search term' : 'Add students manually or upload a CSV file'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#222a3d] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#47a263]/20 flex items-center justify-center text-xs font-bold text-[#7eda95]">
                          {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm text-[#dae2fd] font-medium">{student.studentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-[#89ceff]/10 text-[#89ceff]">
                        Grade {student.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#dae2fd] font-mono">{student.admissionNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#becabd]">{student.stream || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {student.isSuspended ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400">
                          Suspended
                        </span>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${student.isActive ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-[#becabd]/10 text-[#becabd]'}`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {student.userId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-[#7eda95]/10 text-[#7eda95]">
                          <CheckCircle className="w-3 h-3" /> Joined
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#becabd]/10 text-[#becabd]">Not yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="p-2 text-[#becabd] hover:text-[#ffb4ab] hover:bg-[#93000a]/20 rounded-lg transition-colors"
                          title="Remove from register"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {student.userId && (
                          <div className="relative">
                            <button
                              onClick={() => setOpenActionMenu(openActionMenu === student.id ? null : student.id)}
                              className="p-2 text-[#becabd] hover:bg-[#2d3449] rounded-lg transition-colors"
                              title="Account Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openActionMenu === student.id && (
                              <div className="absolute right-0 bottom-full mb-1 w-44 bg-[#171f33] border border-[#3f4940] rounded-lg shadow-xl z-10">
                                <div className="py-1">
                                  {student.isSuspended ? (
                                    <button
                                      onClick={() => {
                                        handleUnsuspendStudent(student);
                                        setOpenActionMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-xs text-[#7eda95] hover:bg-[#2d3449] flex items-center gap-2"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Unsuspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedStudent(student);
                                        setSuspendReason('');
                                        setShowSuspendModal(true);
                                        setOpenActionMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-xs text-amber-400 hover:bg-[#2d3449] flex items-center gap-2"
                                    >
                                      <Ban className="w-3 h-3" />
                                      Suspend Account
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#dae2fd]">Add Student to Register</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-[#becabd] hover:text-[#dae2fd] hover:bg-[#2d3449] rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Student Name *</label>
                <input
                  type="text"
                  value={newStudent.studentName}
                  onChange={(e) => setNewStudent({ ...newStudent, studentName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Grade *</label>
                <select
                  value={newStudent.grade}
                  onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                >
                  <option value="">Select Grade</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Admission Number *</label>
                <input
                  type="text"
                  value={newStudent.admissionNumber}
                  onChange={(e) => setNewStudent({ ...newStudent, admissionNumber: e.target.value })}
                  placeholder="e.g. ADM-2024-001"
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Stream (Optional)</label>
                <input
                  type="text"
                  value={newStudent.stream}
                  onChange={(e) => setNewStudent({ ...newStudent, stream: e.target.value })}
                  placeholder="e.g. Blue, Red, Green"
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#3f4940] text-[#dae2fd] text-sm font-semibold rounded-lg hover:bg-[#2d3449] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                className="flex-1 px-4 py-2.5 bg-[#47a263] text-[#003919] text-sm font-semibold rounded-lg hover:opacity-90 transition-all"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#dae2fd]">Upload Student Register CSV</h3>
              <button onClick={() => { setShowUploadModal(false); setUploadResults(null); }} className="p-2 text-[#becabd] hover:text-[#dae2fd] hover:bg-[#2d3449] rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!uploadResults ? (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#3f4940] rounded-xl p-8 text-center cursor-pointer hover:border-[#7eda95] transition-colors"
                >
                  <FileSpreadsheet className="w-12 h-12 text-[#becabd]/50 mx-auto mb-4" />
                  <p className="text-[#dae2fd] font-semibold mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-[#becabd]/60">CSV files only</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </div>

                <div className="mt-4 p-4 bg-[#060e20] rounded-lg border border-[#3f4940]">
                  <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Expected CSV Format</p>
                  <code className="text-xs text-[#7eda95] block">
                    studentName, grade, admissionNumber, stream
                  </code>
                  <p className="text-xs text-[#becabd]/60 mt-2">
                    Example: John Doe, 7, ADM-2024-001, Blue
                  </p>
                </div>

                <button
                  onClick={downloadSampleCSV}
                  className="w-full mt-4 px-4 py-2.5 border border-[#3f4940] text-[#dae2fd] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#2d3449] transition-all"
                >
                  <Download className="w-4 h-4" /> Download Sample CSV Template
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[#060e20] rounded-lg border border-[#3f4940]">
                  {uploadResults.errorCount === 0 ? (
                    <CheckCircle className="w-8 h-8 text-[#7eda95] shrink-0" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#dae2fd]">
                      {uploadResults.successCount} students added successfully
                    </p>
                    {uploadResults.errorCount > 0 && (
                      <p className="text-xs text-amber-400">{uploadResults.errorCount} failed</p>
                    )}
                  </div>
                </div>

                {uploadResults.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uploadResults.errors.map((err, i) => (
                      <p key={i} className="text-xs text-[#becabd] bg-[#060e20] px-3 py-2 rounded">
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { setShowUploadModal(false); setUploadResults(null); }}
                  className="w-full px-4 py-2.5 bg-[#47a263] text-[#003919] text-sm font-semibold rounded-lg hover:opacity-90 transition-all"
                >
                  Done
                </button>
              </div>
            )}

            {uploading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#7eda95]" />
                <span className="ml-3 text-[#dae2fd] text-sm">Processing CSV...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suspend Student Modal */}
      {showSuspendModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-amber-500/30 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Ban className="w-5 h-5" />
                Suspend Student Account
              </h2>
              <button onClick={() => { setShowSuspendModal(false); setSuspendReason(''); setSelectedStudent(null); }} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedStudent.studentName}</p>
              <p className="text-xs text-[#becabd]">Grade {selectedStudent.grade} • {selectedStudent.admissionNumber}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Reason (Optional)</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-amber-400 outline-none"
                  rows={3}
                  placeholder="e.g. Disciplinary action..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowSuspendModal(false); setSuspendReason(''); setSelectedStudent(null); }} className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all">Cancel</button>
                <button onClick={handleSuspendStudent} className="flex-1 px-4 py-2 bg-amber-500 text-black rounded-lg font-semibold hover:opacity-90 transition-all">Suspend</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
