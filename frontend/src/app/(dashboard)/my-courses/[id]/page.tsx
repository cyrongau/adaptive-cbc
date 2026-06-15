'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
  AlertCircle, Edit3, PlayCircle, Link2, ArrowLeft, ImagePlus, Info,
} from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import HtmlContent from '@/components/ui/HtmlContent';
import toast from 'react-hot-toast';

type TabType = 'curriculum' | 'resources' | 'pricing' | 'reviews' | 'certificates' | 'analytics' | 'assessment-review';

type QuestionType = 'multiple_choice' | 'multiple_answer' | 'true_false' | 'short_answer' | 'fill_in_blank';

interface AssessmentQuestion {
  questionType?: QuestionType;
  question: string; options: string[]; correctAnswer: number; marks: number;
}

interface Course {
  id: string; title: string; subtitle: string; description: string;
  subject: string; grade: number; level: string; price: number;
  status: string; thumbnail: string; featuredImage: string; featuredVideo: string;
  tags: string[]; whatYouWillLearn: string[]; prerequisites: string[];
  targetAudience: string; language: string; certificateEnabled: boolean;
  estimatedDuration: string; totalStudents: number; averageRating: number;
  totalReviews: number; totalModules: number; totalLessons: number;
  totalDurationMinutes: number; modules: CourseModule[];
  assessmentPassThreshold: number;
  assessmentQuestions: AssessmentQuestion[];
}

interface CourseModule {
  id: string; title: string; learningOutcomes: string; coreMaterialContent: string;
  practicalLearningActivities: string; order: number;
  lessonsCount: number; lessons: CourseLesson[];
}

interface CourseLesson {
  id: string; title: string; learningObjective: string; materials: string;
  stepByStepDelivery: string; homework: string; contentType: string;
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
  { key: 'analytics',          label: 'Analytics',          icon: BarChart2 },
  { key: 'assessment-review',  label: 'Assessment Review',  icon: FileText },
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<number>>(new Set());

  const toggleCollapse = (qi: number) => {
    setCollapsedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qi)) next.delete(qi); else next.add(qi);
      return next;
    });
  };

  const isCandidate = user?.role === 'student' && (Number(user?.grade) === 6 || Number(user?.grade) === 9);
  const theme = getTheme(user?.role || 'student', isCandidate);

  useEffect(() => { setIsMounted(true); }, []);

  const normalizeAssessment = (questions: any[]) =>
    (questions || []).map((q: any) => {
      const qt = q.questionType || 'multiple_choice';
      const optCount = qt === 'true_false' ? 2 : (qt === 'short_answer' || qt === 'fill_in_blank') ? 1 : 4;
      return {
        questionType: qt as QuestionType,
        question: q.question || '',
        options: Array.isArray(q.options)
          ? Array.from({ length: optCount }, (_, i) => q.options[i] ?? '')
          : Array.from({ length: optCount }, () => ''),
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        marks: typeof q.marks === 'number' ? q.marks : 1,
      };
    });

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

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (!course || dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const qs = [...course.assessmentQuestions];
    const [moved] = qs.splice(dragIndex, 1);
    qs.splice(dragOverIndex, 0, moved);
    setCourse({ ...course, assessmentQuestions: qs });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // === CURRICULUM ===
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [newLesson, setNewLesson] = useState<{ moduleId: string; title: string; contentType: string } | null>(null);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);

  const addModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      await api.post(`/courses/${id}/modules`, { title: newModuleTitle });
      setNewModuleTitle('');
      showSuccess('Module created');
      fetchCourse();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create module';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
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
      await api.put(`/courses/${id}/modules/${editingLesson.moduleId}/lessons/${editingLesson.id}`, {
        title: editingLesson.title,
        contentType: editingLesson.contentType,
        videoUrl: editingLesson.videoUrl,
        duration: editingLesson.duration,
        learningObjective: editingLesson.learningObjective,
        materials: editingLesson.materials,
        stepByStepDelivery: editingLesson.stepByStepDelivery,
        homework: editingLesson.homework,
        isPreview: editingLesson.isPreview,
        isPublished: editingLesson.isPublished,
      });
      setEditingLesson(null);
      showSuccess('Lesson updated');
      fetchCourse();
    } catch (err) { console.error(err); }
  };

  const saveModule = async () => {
    if (!editingModule) return;
    try {
      await api.put(`/courses/${id}/modules/${editingModule.id}`, {
        title: editingModule.title,
        learningOutcomes: editingModule.learningOutcomes,
        coreMaterialContent: editingModule.coreMaterialContent,
        practicalLearningActivities: editingModule.practicalLearningActivities,
      });
      setEditingModule(null);
      showSuccess('Module updated');
      fetchCourse();
    } catch (err) { console.error(err); }
  };

  const updateModuleField = (field: string, value: any) => {
    if (!editingModule) return;
    setEditingModule({ ...editingModule, [field]: value });
  };

  const [uploadingFeatured, setUploadingFeatured] = useState(false);

  const uploadFeaturedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFeatured(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.patch(`/courses/${id}/featured-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showSuccess('Featured image uploaded');
      fetchCourse();
    } catch (err) { console.error(err); }
    finally { setUploadingFeatured(false); }
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

  // === ASSESSMENT REVIEW ===
  const [assessmentAttempts, setAssessmentAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'assessment-review' && id) {
      setLoadingAttempts(true);
      api.get(`/courses/${id}/assessment/all-attempts`).then((r) => {
        setAssessmentAttempts(r.data || []);
      }).catch(() => {
        setAssessmentAttempts([]);
      }).finally(() => {
        setLoadingAttempts(false);
      });
    }
  }, [activeTab, id]);

  // === COURSE SETTINGS ===
  const saveCourseField = async (field: string, value: any) => {
    setSaving(true);
    try {
      const payload = field === 'info' ? value : { [field]: value };
      await api.put(`/courses/${id}`, payload);
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
          { label: 'Rating', value: Number(course.averageRating || 0).toFixed(1), icon: Star },
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Featured Image</label>
              <div className="flex items-center gap-4">
                {course.featuredImage && (
                  <img src={course.featuredImage} alt="Featured" className="w-24 h-16 object-cover rounded-lg border border-slate-200" />
                )}
                <label className="px-4 py-2 bg-slate-100 text-sm font-semibold text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer flex items-center gap-2">
                  <ImagePlus className="w-4 h-4" />
                  {uploadingFeatured ? 'Uploading...' : 'Upload Image'}
                  <input type="file" className="hidden" onChange={uploadFeaturedImage} accept="image/*" disabled={uploadingFeatured} />
                </label>
                {course.featuredImage && (
                  <span className="text-xs text-slate-400">Click upload to replace</span>
                )}
              </div>
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
                saveCourseField('info', { title, subtitle, description, subject, estimatedDuration: duration, language, featuredVideo, featuredImage: course.featuredImage, whatYouWillLearn: learn?.split('\n').filter(Boolean) || [] });
              }} className="px-6 py-2.5 bg-[#47a263] text-white text-sm font-semibold rounded-xl hover:bg-[#3d8b55] flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-slate-500">Subtitle:</span> <span className="font-medium text-slate-900">{course.subtitle || '—'}</span></div>
              <div><span className="text-slate-500">Subject:</span> <span className="font-medium text-slate-900">{course.subject}</span></div>
              <div><span className="text-slate-500">Duration:</span> <span className="font-medium text-slate-900">{course.estimatedDuration || '—'}</span></div>
              <div><span className="text-slate-500">Language:</span> <span className="font-medium text-slate-900">{course.language}</span></div>
            </div>
            {course.featuredImage && (
              <div className="mt-4">
                <span className="text-xs text-slate-500 block mb-1.5">Featured Image</span>
                <img src={course.featuredImage} alt="Featured" className="w-48 h-32 object-cover rounded-lg border border-slate-200" />
              </div>
            )}
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
                      <div className="border-t border-slate-100 p-4 space-y-4">
                        {/* Module content editors */}
                        {editingModule?.id === mod.id ? (
                          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-slate-700">Module Content</h4>
                            </div>
                            <input
                              value={editingModule.title}
                              onChange={(e) => updateModuleField('title', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                              placeholder="Module title"
                            />
                            <RichTextEditor
                              label="Learning Outcomes"
                              value={editingModule.learningOutcomes || ''}
                              onChange={(val) => updateModuleField('learningOutcomes', val)}
                              placeholder="What students will learn in this module..."
                              minHeight={100}
                            />
                            <RichTextEditor
                              label="Core Material & Content"
                              value={editingModule.coreMaterialContent || ''}
                              onChange={(val) => updateModuleField('coreMaterialContent', val)}
                              placeholder="Core concepts, theories, and reference material..."
                              minHeight={150}
                            />
                            <RichTextEditor
                              label="Practical Learning Activities"
                              value={editingModule.practicalLearningActivities || ''}
                              onChange={(val) => updateModuleField('practicalLearningActivities', val)}
                              placeholder="Hands-on exercises, group work, projects..."
                              minHeight={150}
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingModule(null)} className="px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                              <button onClick={saveModule} className="px-5 py-2 bg-[#47a263] text-white text-sm font-semibold rounded-lg hover:bg-[#3d8b55]"><Save className="w-4 h-4 inline mr-1" /> Save Module</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setEditingModule({ ...mod })}
                              className="text-xs font-semibold text-[#47a263] hover:text-[#3d8b55] flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit Module Content
                            </button>
                          </div>
                        )}

                        {/* New Lesson Input */}
                        {newLesson?.moduleId === mod.id && (
                          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
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
                              <RichTextEditor
                                label="Learning Objective"
                                value={editingLesson.learningObjective || ''}
                                onChange={(val) => setEditingLesson({ ...editingLesson, learningObjective: val })}
                                placeholder="What students will achieve in this lesson..."
                                minHeight={80}
                              />
                              <RichTextEditor
                                label="Materials"
                                value={editingLesson.materials || ''}
                                onChange={(val) => setEditingLesson({ ...editingLesson, materials: val })}
                                placeholder="Required materials, resources, and tools..."
                                minHeight={80}
                              />
                              <RichTextEditor
                                label="Step-by-Step Delivery"
                                value={editingLesson.stepByStepDelivery || ''}
                                onChange={(val) => setEditingLesson({ ...editingLesson, stepByStepDelivery: val })}
                                placeholder="Detailed lesson delivery steps..."
                                minHeight={150}
                              />
                              <RichTextEditor
                                label="Homework / Assignment"
                                value={editingLesson.homework || ''}
                                onChange={(val) => setEditingLesson({ ...editingLesson, homework: val })}
                                placeholder="Homework tasks, exercises, or assignments for this lesson..."
                                minHeight={120}
                              />
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

        {/* COURSE ASSESSMENT */}
        {activeTab === 'curriculum' && (
          <div className="border-t border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Course Assessment (End of Course)</h2>
                <p className="text-sm text-slate-500 mt-1">Create up to 10 questions for the end-of-course assessment</p>
              </div>
              <button
                onClick={() => {
                  const qs = normalizeAssessment(course.assessmentQuestions);
                  if (qs.length >= 10) return;
                  qs.push({ questionType: 'multiple_choice', question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 });
                  setCourse({ ...course, assessmentQuestions: qs });
                }}
                disabled={(course.assessmentQuestions?.length || 0) >= 10}
                className="px-4 py-2 bg-[#47a263] text-white text-sm font-semibold rounded-lg hover:bg-[#3d8b55] disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Question ({(course.assessmentQuestions?.length || 0)}/10)
              </button>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-100 rounded-xl mb-4">
              <span className="text-sm font-semibold text-slate-600 shrink-0">Pass Threshold:</span>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={course.assessmentPassThreshold ?? 50}
                  onChange={(e) => setCourse({ ...course, assessmentPassThreshold: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-300 rounded-full appearance-none cursor-pointer accent-[#47a263]"
                />
                <span className="text-sm font-bold text-[#47a263] min-w-[3ch] text-right">
                  {course.assessmentPassThreshold ?? 50}%
                </span>
              </div>
            </div>

            {(!course.assessmentQuestions || course.assessmentQuestions.length === 0) ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No assessment questions yet</p>
                <p className="text-xs text-slate-300 mt-1">Add questions to create the end-of-course assessment</p>
              </div>
            ) : (
              <div className="space-y-6">
                {course.assessmentQuestions.map((q, qi) => {
                  const qt = q.questionType || 'multiple_choice';
                  const isDragging = dragIndex === qi;
                  const isDragOver = dragOverIndex === qi && dragIndex !== qi;
                  return (
                  <div
                    key={qi}
                    draggable
                    onDragStart={() => handleDragStart(qi)}
                    onDragOver={(e) => handleDragOver(e, qi)}
                    onDragEnd={handleDragEnd}
                    className={`p-5 rounded-xl border space-y-4 transition-all ${
                      isDragging ? 'opacity-50 border-[#47a263] bg-[#47a263]/5 shadow-md' :
                      isDragOver ? 'border-[#47a263] bg-[#47a263]/10 shadow-sm scale-[1.01]' :
                      'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleCollapse(qi)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title={collapsedQuestions.has(qi) ? 'Expand' : 'Collapse'}>
                          {collapsedQuestions.has(qi) ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors" onMouseDown={(e) => e.stopPropagation()}>
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700 shrink-0">Question {qi + 1}</h4>
                        <select
                          value={qt}
                          onChange={(e) => {
                            const newType = e.target.value as QuestionType;
                            const optCount = newType === 'true_false' ? 2 : (newType === 'short_answer' || newType === 'fill_in_blank') ? 1 : 4;
                            const qs = [...course.assessmentQuestions];
                            qs[qi] = {
                              ...qs[qi],
                              questionType: newType,
                              options: Array.from({ length: optCount }, (_, i) => qs[qi]?.options?.[i] || ''),
                              correctAnswer: 0,
                            };
                            setCourse({ ...course, assessmentQuestions: qs });
                          }}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 bg-white"
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="multiple_answer">Multiple Answer</option>
                          <option value="true_false">True / False</option>
                          <option value="short_answer">Short Answer</option>
                          <option value="fill_in_blank">Fill in the Blank</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-slate-500">Marks:</label>
                        <input
                          type="number" min={1} value={q.marks ?? 1}
                          onChange={(e) => {
                            const qs = [...course.assessmentQuestions];
                            qs[qi] = { ...qs[qi], marks: Number(e.target.value) };
                            setCourse({ ...course, assessmentQuestions: qs });
                          }}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs text-center"
                        />
                        <button
                          onClick={() => {
                            const qs = course.assessmentQuestions.filter((_, i) => i !== qi);
                            setCourse({ ...course, assessmentQuestions: qs });
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {collapsedQuestions.has(qi) ? (
                      <div className="flex items-center gap-3 px-1 py-1">
                        <span className="text-xs font-medium text-slate-400 shrink-0">Q:</span>
                        <HtmlContent html={q.question || '<em class="text-slate-300">No question text</em>'} className="text-sm text-slate-600 truncate flex-1 min-w-0" />
                      </div>
                    ) : (
                    <RichTextEditor
                      value={q.question}
                      onChange={(val) => {
                        const qs = [...course.assessmentQuestions];
                        qs[qi] = { ...qs[qi], question: val };
                        setCourse({ ...course, assessmentQuestions: qs });
                      }}
                      placeholder="Enter the question (use Σ button for formulas, or $$...$$ for LaTeX)..."
                      minHeight={80}
                    />
                    )}

                    {!collapsedQuestions.has(qi) && (
                      <>
                    {qt === 'short_answer' ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Correct Answer</label>
                        <RichTextEditor
                          value={q.options[0] || ''}
                          onChange={(val) => {
                            const qs = [...course.assessmentQuestions];
                            qs[qi] = { ...qs[qi], options: [val] };
                            setCourse({ ...course, assessmentQuestions: qs });
                          }}
                          placeholder="Enter the correct answer (may include formulas)..."
                          minHeight={60}
                        />
                      </div>
                    ) : qt === 'fill_in_blank' ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Correct Answer / Phrase</label>
                        <RichTextEditor
                          value={q.options[0] || ''}
                          onChange={(val) => {
                            const qs = [...course.assessmentQuestions];
                            qs[qi] = { ...qs[qi], options: [val] };
                            setCourse({ ...course, assessmentQuestions: qs });
                          }}
                          placeholder="Enter the correct word(s) to fill in the blank..."
                          minHeight={60}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: qt === 'true_false' ? 2 : 4 }, () => null).map((_, oi) => {
                          const opt = q.options?.[oi] ?? '';
                          return (
                          <div
                            key={oi}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              qt === 'multiple_answer'
                                ? (q.correctAnswer & (1 << oi))
                                  ? 'border-green-400 bg-green-50'
                                  : 'border-slate-200 bg-white'
                                : q.correctAnswer === oi
                                  ? 'border-green-400 bg-green-50'
                                  : 'border-slate-200 bg-white'
                            }`}
                          >
                            <label className="flex items-center gap-2 cursor-pointer shrink-0 mt-1">
                              <input
                                type={qt === 'multiple_answer' ? 'checkbox' : 'radio'}
                                name={`q-${qi}-correct`}
                                checked={qt === 'multiple_answer'
                                  ? !!(q.correctAnswer & (1 << oi))
                                  : (q.correctAnswer ?? 0) === oi}
                                onChange={() => {
                                  const qs = [...course.assessmentQuestions];
                                  if (qt === 'multiple_answer') {
                                    qs[qi] = { ...qs[qi], correctAnswer: q.correctAnswer ^ (1 << oi) };
                                  } else {
                                    qs[qi] = { ...qs[qi], correctAnswer: oi };
                                  }
                                  setCourse({ ...course, assessmentQuestions: qs });
                                }}
                                className="accent-[#47a263]"
                              />
                            </label>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold text-slate-500 mb-1 block">
                                {qt === 'true_false' ? (oi === 0 ? 'True' : 'False') : `Option ${oi + 1}`}
                              </span>
                              <RichTextEditor
                                value={opt}
                                onChange={(val) => {
                                  const qs = [...course.assessmentQuestions];
                                  qs[qi] = { ...qs[qi], options: [...(qs[qi].options || Array.from({ length: qt === 'true_false' ? 2 : 4 }, () => ''))] };
                                  qs[qi].options[oi] = val;
                                  setCourse({ ...course, assessmentQuestions: qs });
                                }}
                                placeholder={`Answer option ${oi + 1}`}
                                minHeight={50}
                              />
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                    </>
                    )}
                  </div>
                  );
                })}
                <div className="flex justify-end">
                  <button
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const qs = (course.assessmentQuestions || []).map((q: any) => {
                          const qt = q.questionType || 'multiple_choice';
                          const optCount = qt === 'true_false' ? 2 : (qt === 'short_answer' || qt === 'fill_in_blank') ? 1 : 4;
                          const options = Array.isArray(q.options)
                            ? Array.from({ length: optCount }, (_, i) => q.options[i] ?? '')
                            : Array.from({ length: optCount }, () => '');
                          return {
                            questionType: qt,
                            question: q.question || '',
                            options,
                            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
                            marks: typeof q.marks === 'number' ? q.marks : 1,
                          };
                        });
                        const payload: any = { assessmentQuestions: qs };
                        if (course.assessmentPassThreshold) {
                          payload.assessmentPassThreshold = course.assessmentPassThreshold;
                        }
                        const res = await api.put(`/courses/${id}`, payload);
                        setCourse(res.data);
                        showSuccess('Assessment saved');
                      } catch (err) { console.error(err); }
                      finally { setSaving(false); }
                    }}
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#47a263] text-white text-sm font-semibold rounded-xl hover:bg-[#3d8b55] disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Assessment
                  </button>
                </div>
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
                {Number(pricingForm.price) > 0 && (
                  <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800 space-y-1.5">
                        <p className="font-bold">Making this course purchasable</p>
                        <p>Students will see a <strong>"Purchase"</strong> button instead of "Enroll Now". For them to complete payment, you need to create a linked <strong>store product</strong>.</p>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Go to the <Link href="/store" className="text-amber-900 underline font-semibold">Store</Link> and click <strong>Add Product</strong>.</li>
                          <li>Set <strong>Product Type</strong> to <em>Course Access</em> and the <strong>price</strong> to match this course.</li>
                           <li>Paste this course ID in the <strong>Course ID</strong> field: <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">{id}</code></li>
                          <li>Set <strong>Status</strong> to Published and save.</li>
                        </ol>
                        <p className="text-amber-700">Once saved, the purchase flow will use the store checkout (M-Pesa, card, etc.) and automatically enroll the student on payment confirmation.</p>
                      </div>
                    </div>
                  </div>
                )}
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

                {/* Assessment Stats */}
                {analytics.assessment && (
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4">Assessment Results</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-2xl font-bold text-slate-900">{analytics.assessment.totalAttempts}</span>
                        <p className="text-xs text-slate-500 mt-1">Total Attempts</p>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-slate-900">{analytics.assessment.studentsAttempted}</span>
                        <p className="text-xs text-slate-500 mt-1">Students Attempted</p>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-slate-900">{analytics.assessment.averageScore}</span>
                        <p className="text-xs text-slate-500 mt-1">Avg Score</p>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-slate-900">{analytics.assessment.passRate}%</span>
                        <p className="text-xs text-slate-500 mt-1">Pass Rate</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-sm text-slate-500">Best score: <span className="font-bold text-slate-900">{analytics.assessment.bestScore}</span></p>
                    </div>
                  </div>
                )}

                {/* Review Stats */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4">Ratings & Reviews</h3>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-slate-900">{Number(analytics.reviews.averageRating || 0).toFixed(1)}</p>
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

        {/* ASSESSMENT REVIEW TAB */}
        {activeTab === 'assessment-review' && (
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Assessment Review</h2>
            {loadingAttempts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-[#47a263] animate-spin" />
              </div>
            ) : assessmentAttempts.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No assessment attempts yet</p>
                <p className="text-xs text-slate-300 mt-1">Students need to submit the assessment for their attempts to appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assessmentAttempts.map((attempt: any) => (
                  <div key={attempt.id} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                          attempt.passed ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {attempt.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-slate-900">
                            {attempt.student?.firstName} {attempt.student?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(attempt.submittedAt).toLocaleDateString()} at {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-sm font-extrabold ${attempt.passed ? 'text-green-600' : 'text-slate-500'}`}>
                            {attempt.score} / {attempt.totalMarks}
                          </p>
                          <p className={`text-xs font-semibold ${attempt.passed ? 'text-green-500' : 'text-slate-400'}`}>
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedAttempt === attempt.id ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {expandedAttempt === attempt.id && (
                      <div className="border-t border-slate-200 p-4 space-y-4">
                        {attempt.answers?.map((ans: any, ai: number) => {
                          const qIdx = typeof ans.questionIndex === 'number' ? ans.questionIndex : ai;
                          const question = course?.assessmentQuestions?.[qIdx];
                          return (
                            <div key={ai} className="bg-white rounded-lg p-3 border border-slate-100">
                              <p className="text-xs font-semibold text-slate-500 mb-1">Question {qIdx + 1}</p>
                              {question?.question ? (
                                <HtmlContent html={question.question} className="text-sm text-slate-900 mb-2" />
                              ) : (
                                <p className="text-sm text-slate-400 italic mb-2">Question text not available</p>
                              )}
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-semibold text-slate-400 shrink-0 mt-0.5">Answer:</span>
                                {ans.answer !== undefined && ans.answer !== null && ans.answer !== '' ? (
                                  <HtmlContent html={typeof ans.answer === 'string' ? ans.answer : String(ans.answer)} className="text-sm text-slate-700" />
                                ) : (
                                  <span className="text-sm text-slate-400 italic">No answer submitted</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageSquare(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;}
