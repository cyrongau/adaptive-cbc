'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, Search, Plus, XCircle, GraduationCap, ChevronDown, Mail } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  subject: string;
  grade: number;
  stream?: string;
  studentCount: number;
}

interface Student {
  id: string;
  studentId: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export default function StudentsPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState('');

  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (isTeacher) {
      fetchClasses();
    } else {
      setLoading(false);
    }
  }, [isTeacher]);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes/my-classes');
      setClasses(res.data);
      if (res.data.length > 0) {
        setSelectedClassId(res.data[0].id);
      }
    } catch {
      console.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/classes/${selectedClassId}/students`);
      setStudents(res.data);
    } catch {
      toast.error('Failed to fetch students');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentEmail.trim()) return;
    try {
      const res = await api.post('/users/find-by-email', { email: newStudentEmail.trim() });
      const studentUser = res.data;
      await api.post(`/classes/${selectedClassId}/students`, { studentId: studentUser.id });
      toast.success('Student added!');
      setShowAddModal(false);
      setNewStudentEmail('');
      fetchStudents();
    } catch {
      toast.error('Student not found or already enrolled');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Remove this student from the class?')) return;
    try {
      await api.delete(`/classes/${selectedClassId}/students/${studentId}`);
      toast.success('Student removed');
      fetchStudents();
    } catch {
      toast.error('Failed to remove student');
    }
  };

  if (!isTeacher) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Manage your students</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">This section is for teachers only.</p>
        </div>
      </div>
    );
  }

  const filteredStudents = students.filter((s) => {
    if (!search) return true;
    const name = s.student ? `${s.student.firstName} ${s.student.lastName}`.toLowerCase() : '';
    const email = s.student?.email?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Manage students in your classes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {selectedClassId && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              Add Student
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full md:w-80 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
        >
          {classes.length === 0 && <option value="">No classes available</option>}
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.subject} - Grade {c.grade})
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>

      {selectedClass && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selectedClass.name}</h2>
              <p className="text-sm text-slate-500">{selectedClass.subject} • Grade {selectedClass.grade}{selectedClass.stream ? ` • ${selectedClass.stream}` : ''}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>{students.length} enrolled</span>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{search ? 'No students match your search.' : 'No students enrolled yet. Click "Add Student" to get started.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Email</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {s.student ? `${s.student.firstName[0]}${s.student.lastName[0]}` : '??'}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900">
                            {s.student ? `${s.student.firstName} ${s.student.lastName}` : 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">{s.student?.email || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemoveStudent(s.studentId)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          title="Remove from class"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add Student to Class</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <p className="text-sm text-slate-500 mb-2">Enter the email address of the student you want to add.</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student Email</label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="student@school.com"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowAddModal(false); setNewStudentEmail(''); }} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
