'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import {
  BookOpen, Plus, Settings, Eye, BarChart2, Star, Clock, Users,
  FileText, Video, DollarSign, ExternalLink, MoreHorizontal, Archive,
  Trash2, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';

interface CourseData {
  id: string;
  title: string;
  subtitle: string;
  subject: string;
  grade: number;
  level: string;
  price: number;
  status: string;
  thumbnail: string;
  totalStudents: number;
  totalReviews: number;
  averageRating: number;
  totalLessons: number;
  totalModules: number;
  estimatedDuration: string;
  createdAt: string;
}

export default function MyCoursesPage() {
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', grade: 1, level: 'beginner', price: 0 });

  const isCandidate = user?.role === 'student' && (Number(user?.grade) === 6 || Number(user?.grade) === 9);
  const theme = getTheme(user?.role || 'student', isCandidate);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted) fetchCourses();
  }, [isMounted]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses/my-courses');
      setCourses(res.data || []);
    } catch { setCourses([]); }
    finally { setLoading(false); }
  };

  const createCourse = async () => {
    if (!form.title || !form.subject) return;
    setCreating(true);
    try {
      await api.post('/courses', form);
      setShowCreate(false);
      setForm({ title: '', subject: '', grade: 1, level: 'beginner', price: 0 });
      fetchCourses();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`/courses/${id}/publish`);
      fetchCourses();
    } catch (err) { console.error(err); }
  };

  const handleArchive = async (id: string) => {
    try {
      await api.patch(`/courses/${id}/archive`);
      fetchCourses();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course permanently?')) return;
    try {
      await api.delete(`/courses/${id}`);
      fetchCourses();
    } catch (err) { console.error(err); }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-600',
      published: 'bg-green-100 text-green-700',
      archived: 'bg-amber-100 text-amber-700',
    };
    return styles[status] || styles.draft;
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
          <p className={`${theme.mutedText} mt-1`}>Create and manage your courses</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#47a263] text-white font-semibold text-sm rounded-xl hover:bg-[#3d8b55] transition-all"
        >
          <Plus className="w-4 h-4" /> New Course
        </button>
      </div>

      {/* Course List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-[#47a263] animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-24">
          <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-400">No courses yet</p>
          <p className="text-sm text-slate-300 mt-1">Create your first course to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[#47a263] text-white font-semibold rounded-xl hover:bg-[#3d8b55] transition-all"
          >
            <Plus className="w-5 h-5" /> Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-sm overflow-hidden group`}
            >
              {/* Thumbnail */}
              <div className="h-36 bg-gradient-to-br from-[#47a263]/20 to-[#47a263]/5 flex items-center justify-center relative">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-12 h-12 text-[#47a263]/40" />
                )}
                <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-full ${statusBadge(course.status)}`}>
                  {course.status}
                </span>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-slate-900 truncate">{course.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{course.subject} &bull; Grade {course.grade} &bull; {course.level}</p>

                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {course.totalModules} modules</span>
                  <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {course.totalLessons} lessons</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.totalStudents}</span>
                </div>

                {course.price > 0 && (
                  <div className="mt-2 text-sm font-bold text-[#47a263]">KSh {course.price.toLocaleString()}</div>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Link
                    href={`/my-courses/${course.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#47a263] text-white text-xs font-semibold rounded-lg hover:bg-[#3d8b55] transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" /> Manage
                  </Link>
                  <Link
                    href={`/courses/${course.id}`}
                    className="flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  {course.status === 'draft' && (
                    <button onClick={() => handlePublish(course.id)} className="flex items-center justify-center p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Publish">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  {course.status === 'published' && (
                    <button onClick={() => handleArchive(course.id)} className="flex items-center justify-center p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Archive">
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(course.id)} className="flex items-center justify-center p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Course</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Course Title *</label>
                <input
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30 focus:border-[#47a263]"
                  placeholder="e.g., Grade 4 Math Mastery"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject *</label>
                <select
                  value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30 focus:border-[#47a263]"
                >
                  <option value="">Select subject</option>
                  {['Mathematics', 'English', 'Science', 'Social Studies', 'Kiswahili', 'CRE', 'Agriculture', 'Music', 'PE'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Grade</label>
                  <select value={form.grade} onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30 focus:border-[#47a263]">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Level</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30 focus:border-[#47a263]">
                    {['beginner', 'intermediate', 'advanced', 'all_levels'].map((l) => (
                      <option key={l} value={l}>{l.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (KSh)</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30 focus:border-[#47a263]"
                  placeholder="0 = Free" min="0" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-8">
              <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={createCourse} disabled={creating || !form.title || !form.subject}
                className="px-6 py-2.5 bg-[#47a263] text-white text-sm font-semibold rounded-xl hover:bg-[#3d8b55] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
