'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  BookOpen,
  X,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Ban,
  RotateCcw,
} from 'lucide-react';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subjects?: string[];
  streams?: string[];
  isActive: boolean;
  isSuspended: boolean;
  deletedAt?: string;
  secondaryRoles?: string[];
  createdAt: string;
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subjects: [] as string[],
    streams: [] as string[],
  });
  const [subjectInput, setSubjectInput] = useState('');
  const [streamInput, setStreamInput] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subjects: [] as string[],
    streams: [] as string[],
  });
  const [editSubjectInput, setEditSubjectInput] = useState('');
  const [editStreamInput, setEditStreamInput] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/users');
      const teacherList = response.data.filter((u: any) => u.role === 'teacher');
      setTeachers(teacherList);
    } catch (error) {
      toast.error('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    if (subjectInput.trim() && !formData.subjects.includes(subjectInput.trim())) {
      setFormData({ ...formData, subjects: [...formData.subjects, subjectInput.trim()] });
      setSubjectInput('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setFormData({ ...formData, subjects: formData.subjects.filter((s) => s !== subject) });
  };

  const handleAddStream = () => {
    if (streamInput.trim() && !formData.streams.includes(streamInput.trim())) {
      setFormData({ ...formData, streams: [...formData.streams, streamInput.trim()] });
      setStreamInput('');
    }
  };

  const handleRemoveStream = (stream: string) => {
    setFormData({ ...formData, streams: formData.streams.filter((s) => s !== stream) });
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone || '',
      subjects: teacher.subjects || [],
      streams: teacher.streams || [],
    });
    setEditSubjectInput('');
    setEditStreamInput('');
  };

  const handleEditAddSubject = () => {
    if (editSubjectInput.trim() && !editFormData.subjects.includes(editSubjectInput.trim())) {
      setEditFormData({ ...editFormData, subjects: [...editFormData.subjects, editSubjectInput.trim()] });
      setEditSubjectInput('');
    }
  };

  const handleEditRemoveSubject = (subject: string) => {
    setEditFormData({ ...editFormData, subjects: editFormData.subjects.filter((s) => s !== subject) });
  };

  const handleEditAddStream = () => {
    if (editStreamInput.trim() && !editFormData.streams.includes(editStreamInput.trim())) {
      setEditFormData({ ...editFormData, streams: [...editFormData.streams, editStreamInput.trim()] });
      setEditStreamInput('');
    }
  };

  const handleEditRemoveStream = (stream: string) => {
    setEditFormData({ ...editFormData, streams: editFormData.streams.filter((s) => s !== stream) });
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!editFormData.firstName || !editFormData.lastName || !editFormData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmittingEdit(true);
    try {
      await api.patch(`/users/${editingTeacher.id}`, {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        phone: editFormData.phone,
      });
      toast.success('Teacher updated successfully');
      setEditingTeacher(null);
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update teacher');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.subjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/users/teachers/create', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        subjects: formData.subjects,
        streams: formData.streams,
      });
      toast.success('Teacher created successfully! Temporary password has been generated.');
      setShowModal(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', subjects: [], streams: [] });
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspendTeacher = async () => {
    if (!selectedTeacher) return;
    try {
      await api.patch(`/users/${selectedTeacher.id}/suspend`, { reason: suspendReason || undefined });
      toast.success('Teacher suspended successfully!');
      setShowSuspendModal(false);
      setSuspendReason('');
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to suspend teacher');
    }
  };

  const handleUnsuspendTeacher = async (teacher: Teacher) => {
    try {
      await api.patch(`/users/${teacher.id}/unsuspend`);
      toast.success('Teacher unsuspended successfully!');
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unsuspend teacher');
    }
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;
    try {
      await api.patch(`/users/${selectedTeacher.id}/soft-delete`);
      toast.success('Teacher deleted successfully!');
      setShowDeleteModal(false);
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete teacher');
    }
  };

  const handleRestoreTeacher = async () => {
    if (!selectedTeacher) return;
    try {
      await api.patch(`/users/${selectedTeacher.id}/restore`);
      toast.success('Teacher restored successfully!');
      setShowRestoreModal(false);
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore teacher');
    }
  };

  const filtered = teachers.filter(
    (t) =>
      t.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">Teachers</h2>
          <p className="text-sm text-[#becabd] mt-1">Manage teachers assigned to your institution.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#47a263] text-[#003919] text-xs font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all uppercase tracking-wider"
        >
          <UserPlus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
        <input
          type="text"
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg py-2 pl-10 pr-4 text-[#dae2fd] text-sm focus:border-[#7eda95] focus:ring-0 outline-none"
        />
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((teacher) => (
          <div key={teacher.id} className="bg-[#171f33] border border-[#3f4940] rounded-xl p-6 hover:border-[#7eda95]/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#2d3449] rounded-full flex items-center justify-center font-bold text-sm text-[#dae2fd]">
                  {teacher.firstName[0]}{teacher.lastName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-[#dae2fd]">{teacher.firstName} {teacher.lastName}</h3>
                  <p className="text-xs text-[#becabd]">{teacher.email}</p>
                </div>
              </div>
              {teacher.deletedAt ? (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-500/10 text-gray-400">
                  Deleted
                </span>
              ) : teacher.isSuspended ? (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-500/10 text-red-400">
                  Suspended
                </span>
              ) : (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  teacher.isActive ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'bg-[#ffb4ab]/10 text-[#ffb4ab]'
                }`}>
                  {teacher.isActive ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {teacher.phone && (
                <div className="flex items-center gap-2 text-xs text-[#becabd]">
                  <Phone className="w-3 h-3" />
                  {teacher.phone}
                </div>
              )}
              {teacher.subjects && teacher.subjects.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Subjects</p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.map((subject, i) => (
                      <span key={i} className="text-[10px] bg-[#7eda95]/10 text-[#7eda95] px-2 py-0.5 rounded-full">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {teacher.streams && teacher.streams.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Streams</p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.streams.map((stream, i) => (
                      <span key={i} className="text-[10px] bg-[#89ceff]/10 text-[#89ceff] px-2 py-0.5 rounded-full">
                        {stream}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#3f4940] flex items-center justify-between">
              <p className="text-xs text-[#becabd]">
                Added {new Date(teacher.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2">
                {!teacher.deletedAt && (
                  <button onClick={() => handleEditTeacher(teacher)} className="text-xs text-[#7eda95] font-semibold hover:underline uppercase tracking-wider flex items-center gap-1">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                )}
                <div className="relative">
                  <button
                    onClick={() => setOpenActionMenu(openActionMenu === teacher.id ? null : teacher.id)}
                    className="p-1 hover:bg-[#2d3449] rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-[#becabd]" />
                  </button>
                  {openActionMenu === teacher.id && (
                    <div className="absolute right-0 bottom-full mb-1 w-44 bg-[#171f33] border border-[#3f4940] rounded-lg shadow-xl z-10">
                      <div className="py-1">
                        {teacher.deletedAt ? (
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setShowRestoreModal(true);
                              setOpenActionMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-xs text-[#89ceff] hover:bg-[#2d3449] flex items-center gap-2"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                        ) : (
                          <>
                            {teacher.isSuspended ? (
                              <button
                                onClick={() => {
                                  handleUnsuspendTeacher(teacher);
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
                                  setSelectedTeacher(teacher);
                                  setSuspendReason('');
                                  setShowSuspendModal(true);
                                  setOpenActionMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-xs text-amber-400 hover:bg-[#2d3449] flex items-center gap-2"
                              >
                                <Ban className="w-3 h-3" />
                                Suspend
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setShowDeleteModal(true);
                                setOpenActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-[#2d3449] flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-[#171f33] border border-[#3f4940] rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-[#3f4940] mx-auto mb-4" />
          <p className="text-sm text-[#becabd]">No teachers found.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-[#47a263] text-[#003919] text-xs font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all uppercase tracking-wider mx-auto"
          >
            <UserPlus className="w-4 h-4" /> Add First Teacher
          </button>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3f4940] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#dae2fd]">Add New Teacher</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#2d3449] rounded-lg transition-colors">
                <X className="w-5 h-5 text-[#becabd]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Kamau"
                    className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="teacher@school.com"
                    className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0712345678"
                    className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                  />
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                  Subjects *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); } }}
                    placeholder="Add subject..."
                    className="flex-1 bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-4 py-2.5 bg-[#7eda95]/20 text-[#7eda95] rounded-lg hover:bg-[#7eda95]/30 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.subjects.map((subject, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-[#7eda95]/10 text-[#7eda95] px-3 py-1 rounded-full">
                      <BookOpen className="w-3 h-3" />
                      {subject}
                      <button type="button" onClick={() => handleRemoveSubject(subject)} className="ml-1 hover:text-[#ffb4ab]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Streams */}
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">
                  Streams / Classes (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={streamInput}
                    onChange={(e) => setStreamInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStream(); } }}
                    placeholder="Add stream..."
                    className="flex-1 bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddStream}
                    className="px-4 py-2.5 bg-[#89ceff]/20 text-[#89ceff] rounded-lg hover:bg-[#89ceff]/30 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.streams.map((stream, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-[#89ceff]/10 text-[#89ceff] px-3 py-1 rounded-full">
                      {stream}
                      <button type="button" onClick={() => handleRemoveStream(stream)} className="ml-1 hover:text-[#ffb4ab]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 bg-[#89ceff]/5 border border-[#89ceff]/20 rounded-lg">
                <p className="text-xs text-[#89ceff]">
                  A temporary password will be auto-generated and the teacher will receive an invitation email.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#3f4940] text-[#dae2fd] text-sm font-semibold rounded-lg hover:bg-[#2d3449] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#47a263] text-[#003919] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Create Teacher
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#171f33] border border-[#3f4940] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3f4940] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#dae2fd]">Edit Teacher</h3>
              <button onClick={() => setEditingTeacher(null)} className="p-2 hover:bg-[#2d3449] rounded-lg transition-colors">
                <X className="w-5 h-5 text-[#becabd]" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeacher} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">First Name *</label>
                  <input type="text" required value={editFormData.firstName} onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Last Name *</label>
                  <input type="text" required value={editFormData.lastName} onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
                  <input type="email" required value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
                  <input type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Subjects</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={editSubjectInput} onChange={(e) => setEditSubjectInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEditAddSubject(); } }} placeholder="Add subject..." className="flex-1 bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
                  <button type="button" onClick={handleEditAddSubject} className="px-4 py-2.5 bg-[#7eda95]/20 text-[#7eda95] rounded-lg hover:bg-[#7eda95]/30 transition-colors"><UserPlus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editFormData.subjects.map((subject, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-[#7eda95]/10 text-[#7eda95] px-3 py-1 rounded-full">
                      <BookOpen className="w-3 h-3" />{subject}
                      <button type="button" onClick={() => handleEditRemoveSubject(subject)} className="ml-1 hover:text-[#ffb4ab]"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Streams */}
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-2">Streams / Classes</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={editStreamInput} onChange={(e) => setEditStreamInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEditAddStream(); } }} placeholder="Add stream..." className="flex-1 bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none" />
                  <button type="button" onClick={handleEditAddStream} className="px-4 py-2.5 bg-[#89ceff]/20 text-[#89ceff] rounded-lg hover:bg-[#89ceff]/30 transition-colors"><UserPlus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editFormData.streams.map((stream, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-[#89ceff]/10 text-[#89ceff] px-3 py-1 rounded-full">
                      {stream}<button type="button" onClick={() => handleEditRemoveStream(stream)} className="ml-1 hover:text-[#ffb4ab]"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingTeacher(null)} className="flex-1 px-4 py-2.5 border border-[#3f4940] text-[#dae2fd] text-sm font-semibold rounded-lg hover:bg-[#2d3449] transition-colors">Cancel</button>
                <button type="submit" disabled={submittingEdit} className="flex-1 px-4 py-2.5 bg-[#47a263] text-[#003919] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50">
                  {submittingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Teacher Modal */}
      {showSuspendModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-amber-500/30 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Ban className="w-5 h-5" />
                Suspend Teacher
              </h2>
              <button onClick={() => { setShowSuspendModal(false); setSuspendReason(''); setSelectedTeacher(null); }} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedTeacher.firstName} {selectedTeacher.lastName}</p>
              <p className="text-xs text-[#becabd]">{selectedTeacher.email}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#becabd] uppercase tracking-wider mb-1">Reason (Optional)</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2 text-[#dae2fd] text-sm focus:border-amber-400 outline-none"
                  rows={3}
                  placeholder="e.g. No longer with institution..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowSuspendModal(false); setSuspendReason(''); setSelectedTeacher(null); }} className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all">Cancel</button>
                <button onClick={handleSuspendTeacher} className="flex-1 px-4 py-2 bg-amber-500 text-black rounded-lg font-semibold hover:opacity-90 transition-all">Suspend</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Teacher Modal */}
      {showDeleteModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-red-500/30 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete Teacher
              </h2>
              <button onClick={() => { setShowDeleteModal(false); setSelectedTeacher(null); }} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedTeacher.firstName} {selectedTeacher.lastName}</p>
              <p className="text-xs text-[#becabd]">{selectedTeacher.email}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-red-300">This will soft-delete the account. The teacher will not be able to log in. You can restore later if needed.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowDeleteModal(false); setSelectedTeacher(null); }} className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all">Cancel</button>
              <button onClick={handleDeleteTeacher} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Teacher Modal */}
      {showRestoreModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171f33] border border-[#89ceff]/30 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#89ceff] flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Restore Teacher
              </h2>
              <button onClick={() => { setShowRestoreModal(false); setSelectedTeacher(null); }} className="text-[#becabd] hover:text-[#dae2fd]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#060e20] border border-[#3f4940] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#dae2fd]">{selectedTeacher.firstName} {selectedTeacher.lastName}</p>
              <p className="text-xs text-[#becabd]">{selectedTeacher.email}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowRestoreModal(false); setSelectedTeacher(null); }} className="flex-1 px-4 py-2 border border-[#3f4940] text-[#becabd] rounded-lg font-semibold hover:bg-[#2d3449] transition-all">Cancel</button>
              <button onClick={handleRestoreTeacher} className="flex-1 px-4 py-2 bg-[#89ceff] text-black rounded-lg font-semibold hover:opacity-90 transition-all">Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
