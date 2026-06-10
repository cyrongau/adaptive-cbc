'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BookOpen, Plus, GraduationCap, Users, Trash2, Clock, Copy, Check, LogIn } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  description: string;
  subject: string;
  grade: number;
  stream?: string;
  schedule?: string;
  code?: string;
  studentCount: number;
  isActive: boolean;
}

interface EnrolledClass {
  id: string;
  classId: string;
  status: string;
  class?: ClassData & { teacher?: { id: string; firstName: string; lastName: string } };
}

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies', 'Kiswahili', 'CRE', 'Agriculture', 'Music'];
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function ClassesPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [enrollments, setEnrollments] = useState<EnrolledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: 'Mathematics' as string,
    grade: 4,
    stream: '',
    code: '',
  });
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ day: 'Monday', startTime: '08:00', endTime: '09:00' }]);

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    if (isTeacher) {
      fetchClasses();
    } else if (isStudent) {
      fetchEnrollments();
    } else {
      setLoading(false);
    }
  }, [isTeacher, isStudent]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes/my-classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await api.get('/classes/my-enrollments');
      setEnrollments(response.data || []);
    } catch {
      console.error('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        schedule: timeSlots.length > 0 ? JSON.stringify(timeSlots) : undefined,
      };
      await api.post('/classes', payload);
      toast.success('Class created successfully!');
      setShowModal(false);
      setFormData({ name: '', description: '', subject: 'Mathematics', grade: 4, stream: '', code: '' });
      setTimeSlots([{ day: 'Monday', startTime: '08:00', endTime: '09:00' }]);
      fetchClasses();
    } catch (error) {
      toast.error('Failed to create class');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted!');
      fetchClasses();
    } catch (error) {
      toast.error('Failed to delete class');
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      await api.post('/classes/join', { code: joinCode.trim().toUpperCase() });
      toast.success('Joined class successfully!');
      setShowJoinModal(false);
      setJoinCode('');
      fetchEnrollments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const addSlot = () => {
    setTimeSlots([...timeSlots, { day: 'Monday', startTime: '08:00', endTime: '09:00' }]);
  };

  const removeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const parseSchedule = (schedule?: string): TimeSlot[] => {
    if (!schedule) return [];
    try {
      return JSON.parse(schedule);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isTeacher ? 'My Classes' : 'My Classes'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isTeacher ? 'Manage your teaching classes' : 'View your enrolled classes'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isStudent && (
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
            >
              <LogIn className="w-5 h-5" />
              Join Class
            </button>
          )}
          {isTeacher && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              Create Class
            </button>
          )}
        </div>
      </div>

      {/* Student View: Enrolled Classes */}
      {isStudent && (
        <>
          {enrollments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg mb-2">You haven't joined any classes yet.</p>
              <p className="text-slate-400 mb-4">Ask your teacher for a class code to get started.</p>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 inline-flex items-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Join a Class
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enr) => {
                const cls = enr.class;
                if (!cls) return null;
                const schedule = parseSchedule(cls.schedule);
                return (
                  <div key={enr.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{cls.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{cls.subject} • Grade {cls.grade}{cls.stream ? ` • ${cls.stream}` : ''}</p>
                    {schedule.length > 0 && (
                      <div className="mb-4 space-y-1">
                        <p className="text-xs font-medium text-slate-400 uppercase">Schedule</p>
                        {schedule.map((slot, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{slot.day}: {slot.startTime} - {slot.endTime}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cls.teacher && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users className="w-4 h-4" />
                        <span>Teacher: {cls.teacher.firstName} {cls.teacher.lastName}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Teacher View: Created Classes */}
      {isTeacher && classes.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-4">You haven't created any classes yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
          >
            Create Your First Class
          </button>
        </div>
      )}

      {isTeacher && classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const schedule = parseSchedule(cls.schedule);
            return (
              <div key={cls.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-indigo-600" />
                  </div>
                  <button
                    onClick={() => handleDelete(cls.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{cls.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{cls.subject} • Grade {cls.grade}</p>
                {cls.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{cls.description}</p>
                )}
                {schedule.length > 0 && (
                  <div className="mb-4 space-y-1">
                    <p className="text-xs font-medium text-slate-400 uppercase">Schedule</p>
                    {schedule.map((slot, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{slot.day}: {slot.startTime} - {slot.endTime}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{cls.studentCount} students</span>
                  </div>
                  {cls.code && (
                    <button
                      onClick={() => copyCode(cls.code!, cls.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                    >
                      {copiedId === cls.id ? (
                        <><Check className="w-3.5 h-3.5" /> Copied</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> {cls.code}</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Teacher Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Class</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Grade 4 Mathematics" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" rows={3} placeholder="Brief description of the class" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <select value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500">
                    {SUBJECTS.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                  <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500">
                    {GRADES.map((g) => (<option key={g} value={g}>Grade {g}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stream (optional)</label>
                <input type="text" value={formData.stream} onChange={(e) => setFormData({ ...formData, stream: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Blue, East, 4A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Join Code (optional)</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="e.g., MATH101" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Timetable Slots</label>
                  <button type="button" onClick={addSlot} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Add Slot</button>
                </div>
                <div className="space-y-2">
                  {timeSlots.map((slot, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={slot.day} onChange={(e) => updateSlot(i, 'day', e.target.value)} className="px-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                        {DAYS.map((d) => (<option key={d} value={d}>{d}</option>))}
                      </select>
                      <input type="time" value={slot.startTime} onChange={(e) => updateSlot(i, 'startTime', e.target.value)} className="px-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                      <span className="text-slate-400 text-sm">to</span>
                      <input type="time" value={slot.endTime} onChange={(e) => updateSlot(i, 'endTime', e.target.value)} className="px-2 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                      {timeSlots.length > 1 && (<button type="button" onClick={() => removeSlot(i)} className="p-2 text-slate-400 hover:text-red-500">×</button>)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Create Class</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Class Modal (Student) */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Join a Class</h2>
            <p className="text-sm text-slate-500 mb-4">Enter the class code provided by your teacher.</p>
            <form onSubmit={handleJoinClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class Code</label>
                <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center text-lg font-bold tracking-widest uppercase" placeholder="MATH101" maxLength={20} required autoFocus />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowJoinModal(false); setJoinCode(''); }} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50" disabled={joining}>Cancel</button>
                <button type="submit" disabled={joining || !joinCode.trim()} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {joining ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Joining...</> : <><LogIn className="w-4 h-4" /> Join Class</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
