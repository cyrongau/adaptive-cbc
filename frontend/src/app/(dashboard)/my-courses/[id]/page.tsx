'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import {
  BookOpen, Plus, Trash2, GripVertical, Upload, FileText, Video, Music,
  Image, File, Download, Star, Users, DollarSign, Award, BarChart2,
  ChevronDown, ChevronRight, Save, Eye, Loader2, CheckCircle2, XCircle,
  Settings, ExternalLink, Clock, Target, GraduationCap, TrendingUp,
  AlertCircle, Edit3, PlayCircle, Link2, ArrowLeft,
} from 'lucide-react';

type TabType = 'curriculum' | 'resources' | 'pricing' | 'reviews' | 'certificates' | 'analytics';

interface Course {
  id: string; title: string; subtitle: string; description: string;
  subject: string; grade: number; level: string; price: number;
  status: string; thumbnail: string; featuredVideo: string;
  tags: string[]; whatYouWillLearn: string[]; prerequisites: string[];
  targetAudience: string; language: string; certificateEnabled: boolean;
  estimatedDuration: string; totalStudents: number; averageRating: number;
  totalReviews: number; totalModules: number; totalLessons: number;
  totalDurationMinutes: number; modules: CourseModule[];
}

interface CourseModule {
  id: string; title: string; description: string; order: number;
  lessonsCount: number; lessons: CourseLesson[];
}

interface CourseLesson {
  id: string; title: string; description: string; contentType: string;
  contentUrl: string; videoUrl: string; articleBody: string;
  duration: string; durationMinutes: number; isPreview: boolean;
  order: number; isPublished: boolean; moduleId: string; courseId: string;
}

interface CourseResource {
  id: string; title: string; type: string; url: string;
  originalName: string; fileSize: number; mimeType: string;
  fileDuration: string; lessonId: string; createdAt: string;
}

interface CourseReview {
  id: string; rating: number; comment: string;
  student: { id: string; firstName: string; lastName: string; avatar: string; };
  createdAt: string;
}

interface CourseCertificate {
  id: string; certificateNumber: string; studentName: string;
  issuedAt: string; certificateUrl: string;
  student: { id: string; firstName: string; lastName: string; };
}

const TABS: { key: TabType; label: string; icon: any }[] = [
  { key: 'curriculum', label: 'Curriculum', icon: BookOpen },
  { key: 'resources', label: 'Resources', icon: FileText },
  { key: 'pricing', label: 'Pricing & Enrollments', icon: DollarSign },
  { key: 'reviews', label: 'Reviews', icon: Star },
  { key: 'certificates', label: 'Certificates', icon: Award },
  { key: 'analytics', label: 'Analytics', icon: BarChart2 },
];

export default function CourseManagePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('curriculum');
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  const isCandidate = user?.role === 'student' && (Number(user?.grade) === 6 || Number(user?.grade) === 9);
  const theme = getTheme(user?.role || 'student', isCandidate);

  useEffect(() => { setIsMounted(true); }, []);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data);
    } catch { setCourse(null); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (isMounted) fetchCourse();
  }, [isMounted, fetchCourse]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // === CURRICULUM ===
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [newLesson, setNewLesson] = useState<{ moduleId: string; title: string; contentType: string } | null>(null);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);

  const addModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      await api.post(`/courses/${id}/modules`, { title: newModuleTitle });
      setNewModuleTitle('');
      showSuccess('Module created');
      fetchCourse();
    } catch (err) { console.error(err); }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    try {
      await api.delete(`/courses/${id}/modules/${moduleId}`);
      showSuccess('Module deleted');
      fetchCourse();
    } catch (err) { console.error(err); }
  };

  const addLesson = async (moduleId: string) => {
    if (!newLesson || !newLesson.title.trim()) return;
    try {
      await api.post(`/courses/${id}/modules/${moduleId}/lessons`, {
        title: newLesson.title,
        contentType: newLesson.contentType || 'video',
      });
      setNewLesson(null);
      showSuccess('Lesson added');
      fetchCourse();
    } catch (err) { console.error(err); }
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/courses/${id}/modules/${moduleId}/lessons/${lessonId}`);
      showSuccess('Lesson deleted');
      fetchCourse();
    } catch (err) { console.error(err); }
  };

  const updateLesson = async () => {
    if (!editingLesson) return;
    try {
      await api.put(`/courses/${id}/modules/${editingLesson.moduleId}/lessons/${editingLesson.id}`, editingLesson);
      setEditingLesson(null);
      showSuccess('Lesson updated');
      fetchCourse();
    } catch (err) { console.error(err); }
  };

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // === RESOURCES ===
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (activeTab === 'resources' && id) {
      api.get(`/courses/${id}/resources`).then((r) => setResources(r.data || [])).catch(() => {});
    }
  }, [activeTab, id]);

  const uploadResource = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    try {
      await api.post(`/courses/${id}/resources`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showSuccess('File uploaded');
      const r = await api.get(`/courses/${id}/resources`);
      setResources(r.data || []);
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const deleteResource = async (resourceId: string) => {
    if (!confirm('Delete this resource?')) return;
    try {
      await api.delete(`/courses/${id}/resources/${resourceId}`);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      showSuccess('Resource deleted');
    } catch (err) { console.error(err); }
  };

  // === PRICING ===
  const [pricingForm, setPricingForm] = useState({ price: 0, certificateEnabled: false, status: 'draft' });

  useEffect(() => {
    if (course) {
      setPricingForm({ price: course.price, certificateEnabled: course.certificateEnabled, status: course.status });
    }
  }, [course]);

  const savePricing = async () => {
    setSaving(true);
    try {
      await api.put(`/courses/${id}`, pricingForm);
      showSuccess('Pricing updated');
      fetchCourse();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  // === REVIEWS ===
  const [reviews, setReviews] = useState<CourseReview[]>([]);

  useEffect(() => {
    if (activeTab === 'reviews' && id) {
      api.get(`/courses/${id}/reviews`).then((r) => setReviews(r.data || [])).catch(() => {});
    }
  }, [activeTab, id]);

  // === CERTIFICATES ===
  const [certificates, setCertificates] = useState<CourseCertificate[]>([]);
  const [certStudentId, setCertStudentId] = useState('');
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (activeTab === 'certificates' && id) {
      api.get(`/courses/${id}/certificates`).then((r) => setCertificates(r.data || [])).catch(() => {});
    }
  }, [activeTab, id]);

  const issueCertificate = async () => {
    if (!certStudentId.trim()) return;
    setIssuing(true);
    try {
      await api.post(`/courses/${id}/certificates/issue/${certStudentId}`);
      setCertStudentId('');
      showSuccess('Certificate issued');
      const r = await api.get(`/courses/${id}/certificates`);
      setCertificates(r.data || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to issue certificate');
    }
    finally { setIssuing(false); }
  };

  // === ANALYTICS ===
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'analytics' && id) {
      api.get(`/courses/${id}/analytics`).then((r) => setAnalytics(r.data)).catch(() => {});
    }
  }, [activeTab, id]);

  // === COURSE SETTINGS ===
  const saveCourseField = async (field: string, value: any) => {
    setSaving(true);
    try {
      await api.put(`/courses/${id}`, { [field]: value });
      setEditField(null);
      showSuccess('Saved');
      fetchCourse();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const resourceIcon = (type: string) => {
    const icons: Record<string, any> = { pdf: FileText, audio: Music, video: Video, document: File, image: Image };
    const Icon = icons[type] || File;
    return <Icon className="w-5 h-5" />;
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-10 h-10 text-[#47a263] animate-spin" /></div>;
  }

  if (!course) {
    return <div className="text-center py-24"><XCircle className="w-16 h-16 text-red-200 mx-auto mb-4" /><p className="text-lg font-semibold text-slate-400">Course not found</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="fixed top-6 right-6 z-50 px-5 py-3 bg-green-600 text-white rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </motion.div>
      )}

      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/my-courses')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                course.status === 'published' ? 'bg-green-100 text-green-700' :
                course.status === 'archived' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>{course.status}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{course.subject} &bull; Grade {course.grade} &bull; {course.level.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-slate-400" />
          <a href={`/courses/${course.id}`} target="_blank" className="text-sm font-semibold text-[#47a263] hover:underline">View on site</a>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Students', value: course.totalStudents, icon: Users },
          { label: 'Modules', value: course.totalModules, icon: BookOpen },
          { label: 'Lessons', value: course.totalLessons, icon: Video },
          { label: 'Rating', value: course.averageRating.toFixed(1), icon: Star },
          { label: 'Reviews', value: course.totalReviews, icon: MessageSquare },
        ].map((s, i) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Course Info Editor */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Course Information</h2>
          <button onClick={() => setEditField(editField === 'info' ? null : 'info')} className="flex items-center gap-1.5 text-sm font-semibold text-[#47a263] hover:text-[#3d8b55]">
            <Edit3 className="w-4 h-4" /> {editField === 'info' ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editField === 'info' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input defaultValue={course.title} id="edit-title" className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="Title" />
              <input defaultValue={course.subtitle} id="edit-subtitle" className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="Subtitle" />
            </div>
            <textarea defaultValue={course.description} id="edit-desc" rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30" placeholder="Description" />
            <div className="grid grid-cols-3 gap-4">
              <input defaultValue={course.subject} id="edit-subject" className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Subject" />
              <input defaultValue={course.estimatedDuration || ''} id="edit-duration" className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Duration (e.g. 8 weeks)" />
              <input defaultValue={course.language} id="edit-lang" className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Language" />
            </div>
            <div className="flex items-center gap-3">
              <input defaultValue={course.featuredVideo || ''} id="edit-video" className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Featured video URL (YouTube)" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">What You Will Learn (one per line)</label>
              <textarea defaultValue={course.whatYouWillLearn?.join('\n') || ''} id="edit-learn" rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditField(null)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800">Cancel</button>
              <button onClick={() => {
                const title = (document.getElementById('edit-title') as HTMLInputElement)?.value;
                const subtitle = (document.getElementById('edit-subtitle') as HTMLInputElement)?.value;
                const description = (document.getElementById('edit-desc') as HTMLTextAreaElement)?.value;
                const subject = (document.getElementById('edit-subject') as HTMLInputElement)?.value;
                const duration = (document.getElementById('edit-duration') as HTMLInputElement)?.value;
                const language = (document.getElementById('edit-lang') as HTMLInputElement)?.value;
                const featuredVideo = (document.getElementById('edit-video') as HTMLInputElement)?.value;
                const learn = (document.getElementById('edit-learn') as HTMLTextAreaElement)?.value;
                saveCourseField('info', { title, subtitle, description, subject, estimatedDuration: duration, language, featuredVideo, whatYouWillLearn: learn?.split('\n').filter(Boolean) || [] });
              }} className="px-6 py-2.5 bg-[#47a263] text-white text-sm font-semibold rounded-xl hover:bg-[#3d8b55] flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-slate-500">Subtitle:</span> <span className="font-medium text-slate-900">{course.subtitle || '—'}</span></div>
            <div><span className="text-slate-500">Subject:</span> <span className="font-medium text-slate-900">{course.subject}</span></div>
            <div><span className="text-slate-500">Duration:</span> <span className="font-medium text-slate-900">{course.estimatedDuration || '—'}</span></div>
            <div><span className="text-slate-500">Language:</span> <span className="font-medium text-slate-900">{course.language}</span></div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-[#47a263] border-t-2 border-l border-r border-slate-200 -mb-[2px] shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* CURRICULUM TAB */}
        {activeTab === 'curriculum' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Curriculum Builder</h2>
            </div>

            {/* Add Module */}
            <div className="flex items-center gap-3 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <input
                value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="New module title..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30"
                onKeyDown={(e) => e.key === 'Enter' && addModule()}
              />
              <button onClick={addModule} className="px-5 py-2.5 bg-[#47a263] text-white text-sm font-semibold rounded-lg hover:bg-[#3d8b55] flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Module
              </button>
            </div>

            {/* Module List */}
            {course.modules?.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
                <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-400">No modules yet</p>
                <p className="text-sm text-slate-300 mt-1">Start building your curriculum by adding a module</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(course.modules || []).sort((a, b) => a.order - b.order).map((mod) => (
                  <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-slate-300" />
                        <div className="text-left">
                          <h3 className="font-bold text-slate-900">{mod.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{mod.lessonsCount || mod.lessons?.length || 0} lessons</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setNewLesson({ moduleId: mod.id, title: '', contentType: 'video' }); }}
                          className="p-1.5 text-slate-400 hover:text-[#47a263] hover:bg-green-50 rounded-lg transition-colors"
                          title="Add lesson"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteModule(mod.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete module"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {expandedModules[mod.id] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {expandedModules[mod.id] && (
                      <div className="border-t border-slate-100 p-4 space-y-2">
                        {/* New Lesson Input */}
                        {newLesson?.moduleId === mod.id && (
                          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3">
                            <input
                              value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                              placeholder="Lesson title..."
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30"
                              onKeyDown={(e) => e.key === 'Enter' && addLesson(mod.id)}
                            />
                            <select
                              value={newLesson.contentType}
                              onChange={(e) => setNewLesson({ ...newLesson, contentType: e.target.value })}
                              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            >
                              <option value="video">Video</option>
                              <option value="article">Article</option>
                              <option value="quiz">Quiz</option>
                              <option value="assignment">Assignment</option>
                              <option value="audio">Audio</option>
                              <option value="document">Document</option>
                            </select>
                            <button onClick={() => addLesson(mod.id)} className="px-3 py-2 bg-[#47a263] text-white text-xs font-semibold rounded-lg hover:bg-[#3d8b55]"><Plus className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setNewLesson(null)} className="p-2 text-slate-400 hover:text-slate-600"><XCircle className="w-4 h-4" /></button>
                          </div>
                        )}

                        {/* Existing Lessons */}
                        {(mod.lessons || []).sort((a, b) => a.order - b.order).map((lesson) => (
                          editingLesson?.id === lesson.id ? (
                            <div key={lesson.id} className="p-4 bg-green-50 rounded-xl border border-green-200 space-y-3">
                              <input defaultValue={lesson.title} onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                              <div className="grid grid-cols-3 gap-3">
                                <select value={editingLesson.contentType} onChange={(e) => setEditingLesson({ ...editingLesson, contentType: e.target.value })}
                                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                                  <option value="video">Video</option><option value="article">Article</option>
                                  <option value="quiz">Quiz</option><option value="assignment">Assignment</option>
                                  <option value="audio">Audio</option><option value="document">Document</option>
                                </select>
                                <input defaultValue={lesson.videoUrl || ''} onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                                  placeholder="Video URL" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                <input defaultValue={lesson.duration || ''} onChange={(e) => setEditingLesson({ ...editingLesson, duration: e.target.value })}
                                  placeholder="Duration (10:00)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                              </div>
                              <textarea defaultValue={lesson.description || ''} onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                                rows={2} placeholder="Description" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                  <input type="checkbox" checked={editingLesson.isPreview} onChange={(e) => setEditingLesson({ ...editingLesson, isPreview: e.target.checked })} />
                                  Free preview
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                  <input type="checkbox" checked={editingLesson.isPublished} onChange={(e) => setEditingLesson({ ...editingLesson, isPublished: e.target.checked })} />
                                  Published
                                </label>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingLesson(null)} className="px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                                <button onClick={updateLesson} className="px-5 py-2 bg-[#47a263] text-white text-sm font-semibold rounded-lg hover:bg-[#3d8b55]"><Save className="w-4 h-4 inline mr-1" /> Save</button>
                              </div>
                            </div>
                          ) : (
                            <div key={lesson.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  lesson.contentType === 'video' ? 'bg-purple-50 text-purple-600' :
                                  lesson.contentType === 'article' ? 'bg-blue-50 text-blue-600' :
                                  lesson.contentType === 'quiz' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                                }`}>
                                  {lesson.contentType === 'video' ? <PlayCircle className="w-4 h-4" /> :
                                   lesson.contentType === 'article' ? <FileText className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{lesson.title}</p>
                                  <p className="text-xs text-slate-500">
                                    {lesson.contentType}
                                    {lesson.duration ? ` • ${lesson.duration}` : ''}
                                    {lesson.isPreview ? ' • Free preview' : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingLesson(lesson)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteLesson(mod.id, lesson.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Resource Upload Manager</h2>
              <label className="px-5 py-2.5 bg-[#47a263] text-white text-sm font-semibold rounded-lg hover:bg-[#3d8b55] cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload File'}
                <input type="file" className="hidden" onChange={uploadResource} disabled={uploading} accept=".pdf,.mp3,.mp4,.wav,.ogg,.webm,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif" />
              </label>
            </div>

            {resources.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
                <Upload className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-400">No resources uploaded</p>
                <p className="text-sm text-slate-300 mt-1">Upload PDFs, audio files, videos, and documents</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((res) => (
                  <div key={res.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        res.type === 'pdf' ? 'bg-red-50 text-red-600' :
                        res.type === 'audio' ? 'bg-purple-50 text-purple-600' :
                        res.type === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {resourceIcon(res.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{res.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {res.type.toUpperCase()}
                          {res.fileSize ? ` • ${(res.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={res.url} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <Download className="w-3 h-3" /> Download
                          </a>
                          <button onClick={() => deleteResource(res.id)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRICING & ENROLLMENT TAB */}
        {activeTab === 'pricing' && (
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Pricing & Enrollment Settings</h2>
            <div className="max-w-xl space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Course Price (KSh)</label>
                <input
                  type="number" value={pricingForm.price} min="0"
                  onChange={(e) => setPricingForm({ ...pricingForm, price: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30"
                />
                <p className="text-xs text-slate-400 mt-1">Set to 0 for free course</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox" id="cert-toggle" checked={pricingForm.certificateEnabled}
                  onChange={(e) => setPricingForm({ ...pricingForm, certificateEnabled: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-[#47a263] focus:ring-[#47a263]"
                />
                <label htmlFor="cert-toggle" className="text-sm font-medium text-slate-700">Enable certificate on completion</label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Course Status</label>
                <select value={pricingForm.status} onChange={(e) => setPricingForm({ ...pricingForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#47a263]/30">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <button onClick={savePricing} disabled={saving}
                className="px-6 py-2.5 bg-[#47a263] text-white text-sm font-semibold rounded-xl hover:bg-[#3d8b55] disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
              </button>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Student Reviews</h2>
            {reviews.length === 0 ? (
              <div className="text-center py-16">
                <Star className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-400">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#47a263]/10 flex items-center justify-center text-xs font-bold text-[#47a263]">
                          {review.student?.firstName?.[0]}{review.student?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{review.student?.firstName} {review.student?.lastName}</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="text-sm text-slate-600 mt-2">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CERTIFICATES TAB */}
        {activeTab === 'certificates' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Certificate Issuance</h2>
              {!course.certificateEnabled && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Certificates disabled</span>
              )}
            </div>

            {/* Issue Certificate */}
            {course.certificateEnabled && (
              <div className="flex items-center gap-3 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  value={certStudentId} onChange={(e) => setCertStudentId(e.target.value)}
                  placeholder="Student ID to issue certificate..."
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none"
                />
                <button onClick={issueCertificate} disabled={issuing || !certStudentId.trim()}
                  className="px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2">
                  {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />} Issue
                </button>
              </div>
            )}

            {/* Certificate List */}
            {certificates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-400">No certificates issued</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Student</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Certificate #</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Issued</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-900 font-medium">{cert.studentName}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs">{cert.certificateNumber}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(cert.issuedAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-blue-600 hover:underline text-xs font-semibold">Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Course Analytics</h2>
            {!analytics ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-[#47a263] animate-spin" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Student Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Enrolled', value: analytics.students.total, icon: Users, color: 'text-blue-600' },
                    { label: 'Active Learners', value: analytics.students.active, icon: TrendingUp, color: 'text-green-600' },
                    { label: 'Completed', value: analytics.students.completed, icon: GraduationCap, color: 'text-purple-600' },
                    { label: 'Avg Progress', value: `${analytics.students.averageProgress}%`, icon: Target, color: 'text-amber-600' },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                        <span className="text-xs text-slate-500">{s.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Curriculum Stats */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4">Curriculum Overview</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div><span className="text-2xl font-bold text-slate-900">{analytics.curriculum.totalModules}</span><p className="text-xs text-slate-500 mt-1">Modules</p></div>
                    <div><span className="text-2xl font-bold text-slate-900">{analytics.curriculum.totalLessons}</span><p className="text-xs text-slate-500 mt-1">Lessons</p></div>
                    <div><span className="text-2xl font-bold text-slate-900">{Math.round(analytics.curriculum.totalDurationMinutes / 60)}h</span><p className="text-xs text-slate-500 mt-1">Total Duration</p></div>
                  </div>
                </div>

                {/* Revenue */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4">Revenue</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-2xl font-bold text-slate-900">KSh {analytics.revenue.total.toLocaleString()}</span><p className="text-xs text-slate-500 mt-1">Total Revenue</p></div>
                    <div><span className="text-2xl font-bold text-slate-900">KSh {Math.round(analytics.revenue.averagePerStudent).toLocaleString()}</span><p className="text-xs text-slate-500 mt-1">Avg per Student</p></div>
                  </div>
                </div>

                {/* Review Stats */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4">Ratings & Reviews</h3>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-slate-900">{analytics.reviews.averageRating.toFixed(1)}</p>
                      <p className="text-xs text-slate-500 mt-1">out of 5</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = analytics.reviews.distribution[star] || 0;
                        const max = Math.max(...(Object.values(analytics.reviews.distribution) as number[]), 1);
                        const pct = (count / max) * 100;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-slate-500">{star}</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-right text-slate-400">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">{analytics.reviews.total} total reviews</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageSquare(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;}
