'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search,
  BookOpen,
  FileText,
  Download,
  Filter,
  Upload,
  Clock,
  Star,
  Eye,
  GraduationCap,
  ChevronRight,
  FolderOpen,
  Plus,
  X,
  Globe,
  Lock,
  DollarSign,
  Scan,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const TERMS = ['Term 1', 'Term 2', 'Term 3', 'All Terms'];
const DOC_TYPES = ['Past Paper', 'Notes', 'Guide', 'Worksheet', 'Scheme of Work', 'Lesson Plan'];

const CBC_SUBJECTS = [
  'Literacy',
  'Kiswahili',
  'English',
  'Mathematics',
  'Environmental Activities',
  'Science and Technology',
  'Integrated Science',
  'Social Studies',
  'Creative Arts and Sports',
  'Home Science',
  'Agriculture',
  'Pre-Technical Studies',
  'Religious Education',
  'Life Skills Education',
  'Business Studies',
  'French',
  'German',
  'Arabic',
  'Sign Language',
  'Braille',
  'Hygiene and Nutrition',
  'Movement and Creative Activities',
  'Physical and Health Education',
  'Music',
  'Art and Craft',
  'Computer Studies',
  'Science',
];

const PAPER_TYPE_MAP: Record<string, string> = {
  past_paper: 'Past Paper',
  revision_kit: 'Revision Kit',
  mock_exam: 'Mock Exam',
  work_sheet: 'Worksheet',
  notes: 'Notes',
};

interface LibraryPaper {
  id: string;
  title: string;
  description: string | null;
  paperType: string;
  subjectId: string;
  grade: number;
  year: number | null;
  term: number | null;
  pageCount: number;
  status: string;
  visibility: string;
  downloadCount: number;
  viewCount: number;
  isPremium: boolean;
  price: number;
  isFeatured: boolean;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  subjectName?: string;
}

export default function LibraryPage() {
  const { user } = useAuthStore();
  const [papers, setPapers] = useState<LibraryPaper[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [totalPapers, setTotalPapers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ subjectId: '', grade: '', term: '', paperType: '' });
  const [page, setPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', subjectId: '', grade: 4, term: 1, paperType: 'notes', description: '', visibility: 'public', isPremium: false, price: 0 });
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrJobId, setOcrJobId] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [ocrStage, setOcrStage] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrExtractedQuestions, setOcrExtractedQuestions] = useState<any[]>([]);
  const [ocrErrorMessage, setOcrErrorMessage] = useState('');
  const [ocrMetadata, setOcrMetadata] = useState({ subjectId: '', grade: 7, paperType: 'past_paper', year: new Date().getFullYear(), term: 1 });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; paperId: string; paperTitle: string }>({ open: false, paperId: '', paperTitle: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isTeacher = user?.role === 'teacher' || user?.role === 'super_admin' || user?.role === 'institution_admin';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'institution_admin';

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchPapers();
  }, [filters, searchTerm, page]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
    } catch {
      setSubjects([]);
    }
  };

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (filters.subjectId) params.subjectId = filters.subjectId;
      if (filters.grade) params.grade = parseInt(filters.grade);
      if (filters.term && filters.term !== 'All Terms') params.term = parseInt(filters.term.replace('Term ', ''));
      if (filters.paperType) {
        const typeKey = Object.entries(PAPER_TYPE_MAP).find(([, v]) => v === filters.paperType);
        if (typeKey) params.paperType = typeKey[0];
      }
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/digital-library/papers', { params });
      const { papers: fetchedPapers, total } = res.data;
      const papersWithSubjects = fetchedPapers.map((p: LibraryPaper) => {
        const subject = subjects.find(s => s.id === p.subjectId);
        return { ...p, subjectName: subject?.name || 'Unknown' };
      });
      setPapers(papersWithSubjects);
      setTotalPapers(total);
    } catch (error: any) {
      toast.error('Failed to load library content');
      setPapers([]);
      setTotalPapers(0);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/digital-library/papers', {
        title: uploadForm.title,
        description: uploadForm.description,
        paperType: uploadForm.paperType,
        subjectId: uploadForm.subjectId,
        grade: uploadForm.grade,
        year: new Date().getFullYear(),
        term: uploadForm.term,
        visibility: uploadForm.visibility,
        isPremium: uploadForm.isPremium,
        price: uploadForm.price,
      });
      toast.success('Resource uploaded successfully!');
      setShowUploadModal(false);
      setUploadForm({ title: '', subjectId: '', grade: 4, term: 1, paperType: 'notes', description: '', visibility: 'public', isPremium: false, price: 0 });
      fetchPapers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload resource');
    }
  };

  const handleOcrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        toast.error('Please upload a PDF or image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be under 10MB');
        return;
      }
      setOcrFile(file);
      setOcrStatus('idle');
      setOcrJobId(null);
      setOcrExtractedQuestions([]);
      setOcrErrorMessage('');
    }
  };

  const handleOcrUpload = async () => {
    if (!ocrFile) {
      toast.error('Please select a file first');
      return;
    }
    if (!ocrMetadata.subjectId) {
      toast.error('Please select a subject');
      return;
    }
    setOcrStatus('uploading');
    setOcrProgress(0);
    setOcrErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('file', ocrFile);
      formData.append('subjectId', ocrMetadata.subjectId);
      formData.append('grade', ocrMetadata.grade.toString());
      formData.append('paperType', ocrMetadata.paperType);
      formData.append('year', ocrMetadata.year.toString());
      formData.append('term', ocrMetadata.term.toString());
      const response = await api.post('/digital-library/ocr/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const jobId = response.data.id || response.data.jobId;
      setOcrJobId(jobId);
      setOcrStatus('processing');
      pollOcrStatus(jobId);
    } catch (error: any) {
      setOcrStatus('error');
      setOcrErrorMessage(error.response?.data?.message || 'Failed to upload file for OCR processing');
      toast.error('Upload failed');
    }
  };

  const pollOcrStatus = async (jobId: string) => {
    let attempts = 0;
    const maxAttempts = 120;
    const poll = async () => {
      try {
        const response = await api.get(`/digital-library/ocr/status/${jobId}`);
        const { status, stage, progress, result } = response.data;
        setOcrStage(stage || '');
        setOcrProgress(progress || 0);
        if (status === 'completed') {
          setOcrStatus('completed');
          setOcrExtractedQuestions(result?.questions || []);
          if (result?.questions?.length > 0) {
            toast.success(`Extracted ${result.questions.length} question(s)!`);
          } else {
            toast.success('OCR complete. No questions detected — you can add them manually.');
          }
          return;
        }
        if (status === 'failed') {
          setOcrStatus('error');
          setOcrErrorMessage(result?.error || 'OCR processing failed');
          toast.error('OCR processing failed');
          return;
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setOcrStatus('error');
          setOcrErrorMessage('OCR processing timed out after 6 minutes');
          toast.error('OCR processing timed out');
        }
      } catch (error: any) {
        const statusCode = error.response?.status;
        if (statusCode === 404 || statusCode === 503) {
          setOcrStatus('error');
          setOcrErrorMessage('OCR service is currently unavailable. Please try again later.');
          toast.error('OCR service unavailable');
          return;
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setOcrStatus('error');
          setOcrErrorMessage('Failed to check OCR status after multiple attempts');
          toast.error('Failed to check OCR status');
        }
      }
    };
    setTimeout(poll, 3000);
  };

  const handleSaveOcrQuestions = async () => {
    try {
      await api.post('/digital-library/ocr/save', {
        jobId: ocrJobId,
        questions: ocrExtractedQuestions,
      });
      toast.success('Questions saved successfully!');
      setShowOcrModal(false);
      resetOcrState();
      fetchPapers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save questions');
    }
  };

  const resetOcrState = () => {
    setOcrFile(null);
    setOcrJobId(null);
    setOcrStatus('idle');
    setOcrStage('');
    setOcrProgress(0);
    setOcrExtractedQuestions([]);
    setOcrErrorMessage('');
    setOcrMetadata({ subjectId: '', grade: 7, paperType: 'past_paper', year: new Date().getFullYear(), term: 1 });
  };

  const totalPages = Math.ceil(totalPapers / 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Digital Library</h1>
          <p className="text-slate-500 mt-1">Access learning materials, past papers, and resources</p>
        </div>
        {isTeacher && (
          <div className="flex gap-2">
            <button
              onClick={() => { setShowOcrModal(true); resetOcrState(); }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
            >
              <Scan className="w-5 h-5" />
              OCR Scan Document
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
            >
              <Upload className="w-5 h-5" />
              Upload Resource
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Resources', value: totalPapers, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
          { label: 'Subjects', value: subjects.length, icon: FolderOpen, color: 'bg-purple-50 text-purple-600' },
          { label: 'Total Downloads', value: papers.reduce((sum, p) => sum + p.downloadCount, 0).toLocaleString(), icon: Download, color: 'bg-green-50 text-green-600' },
          { label: 'Total Views', value: papers.reduce((sum, p) => sum + p.viewCount, 0).toLocaleString(), icon: Eye, color: 'bg-amber-50 text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filters.subjectId}
              onChange={(e) => { setFilters({ ...filters, subjectId: e.target.value }); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">All Subjects</option>
              {subjects.length > 0
                ? subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                : CBC_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filters.grade}
              onChange={(e) => { setFilters({ ...filters, grade: e.target.value }); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">All Grades</option>
              {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
            <select
              value={filters.term}
              onChange={(e) => { setFilters({ ...filters, term: e.target.value }); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">All Terms</option>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={filters.paperType}
              onChange={(e) => { setFilters({ ...filters, paperType: e.target.value }); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="h-5 bg-slate-200 rounded w-16" />
                <div className="h-5 bg-slate-200 rounded w-16" />
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-100">
                <div className="h-4 bg-slate-200 rounded w-20" />
                <div className="h-4 bg-slate-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No resources found matching your criteria.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.map((paper, i) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 line-clamp-2">{paper.title}</h3>
                    <p className="text-sm text-slate-500">{paper.subjectName} • Grade {paper.grade}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">{PAPER_TYPE_MAP[paper.paperType] || paper.paperType}</span>
                  {paper.term && <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">Term {paper.term}</span>}
                  {paper.pageCount > 0 && <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">{paper.pageCount} pages</span>}
                  {paper.isPremium && <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs rounded-lg font-medium">Premium</span>}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {paper.downloadCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {paper.viewCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.preventDefault(); setDeleteModal({ open: true, paperId: paper.id, paperTitle: paper.title }); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link href={`/library/${paper.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                      View <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium ${page === p ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Upload Resource</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <select
                    value={uploadForm.subjectId}
                    onChange={(e) => setUploadForm({ ...uploadForm, subjectId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    required
                  >
                    <option value="">Select subject</option>
                    {subjects.length > 0
                      ? subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                      : CBC_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                  <select
                    value={uploadForm.grade}
                    onChange={(e) => setUploadForm({ ...uploadForm, grade: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  >
                    {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Term</label>
                  <select
                    value={uploadForm.term}
                    onChange={(e) => setUploadForm({ ...uploadForm, term: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={uploadForm.paperType}
                    onChange={(e) => setUploadForm({ ...uploadForm, paperType: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="past_paper">Past Paper</option>
                    <option value="notes">Notes</option>
                    <option value="revision_kit">Revision Kit</option>
                    <option value="mock_exam">Mock Exam</option>
                    <option value="work_sheet">Worksheet</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  rows={3}
                />
              </div>

              {/* Visibility & Pricing - teacher/tutor only */}
              {user?.role === 'teacher' || user?.role === 'tutor' ? (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-700">Access & Distribution</p>

                  {/* Visibility toggle */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Who can access this content?</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setUploadForm({ ...uploadForm, visibility: 'public' })}
                        className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          uploadForm.visibility === 'public'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        Public (Library)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadForm({ ...uploadForm, visibility: 'institution_only' })}
                        className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          uploadForm.visibility === 'institution_only'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Lock className="w-4 h-4" />
                        Institution Only
                      </button>
                    </div>
                    {uploadForm.visibility === 'public' && (
                      <p className="text-xs text-slate-400 mt-1">Added to the library and accessible by everyone.</p>
                    )}
                    {uploadForm.visibility === 'institution_only' && (
                      <p className="text-xs text-slate-400 mt-1">Only students & staff of your institution can access.</p>
                    )}
                  </div>

                  {/* Pricing toggle */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Pricing</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setUploadForm({ ...uploadForm, isPremium: false, price: 0 })}
                        className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          !uploadForm.isPremium
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        Free
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadForm({ ...uploadForm, isPremium: true })}
                        className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          uploadForm.isPremium
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        Paid (Marketplace)
                      </button>
                    </div>
                    {uploadForm.isPremium && (
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Price (KES)</label>
                        <input
                          type="number"
                          min={0}
                          value={uploadForm.price}
                          onChange={(e) => setUploadForm({ ...uploadForm, price: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                          placeholder="e.g. 500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Drag & drop files or click to upload</p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOC, PPT up to 10MB</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OCR Scan Modal */}
      {showOcrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-900">OCR Document Scan</h2>
              </div>
              <button onClick={() => { setShowOcrModal(false); resetOcrState(); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Upload Step */}
            {ocrStatus === 'idle' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Upload a scanned exam or document (PDF or image). Our AI will extract questions automatically.</p>

                {/* Metadata fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                    <select
                      value={ocrMetadata.subjectId}
                      onChange={(e) => setOcrMetadata({ ...ocrMetadata, subjectId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Select subject</option>
                      {subjects.length > 0
                        ? subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                        : CBC_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Grade</label>
                    <select
                      value={ocrMetadata.grade}
                      onChange={(e) => setOcrMetadata({ ...ocrMetadata, grade: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Paper Type</label>
                    <select
                      value={ocrMetadata.paperType}
                      onChange={(e) => setOcrMetadata({ ...ocrMetadata, paperType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="past_paper">Past Paper</option>
                      <option value="mock_exam">Mock Exam</option>
                      <option value="work_sheet">Worksheet</option>
                      <option value="notes">Notes</option>
                      <option value="revision_kit">Revision Kit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Year</label>
                    <input
                      type="number"
                      value={ocrMetadata.year}
                      onChange={(e) => setOcrMetadata({ ...ocrMetadata, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      min={2000}
                      max={2030}
                    />
                  </div>
                </div>

                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-emerald-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('ocr-file-input')?.click()}
                >
                  <input
                    id="ocr-file-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.tiff"
                    onChange={handleOcrFileSelect}
                    className="hidden"
                  />
                  <Scan className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-base font-medium text-slate-600">
                    {ocrFile ? ocrFile.name : 'Click to select PDF or image'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG up to 10MB</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowOcrModal(false); resetOcrState(); }}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOcrUpload}
                    disabled={!ocrFile || !ocrMetadata.subjectId}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Scan className="w-4 h-4" />
                    Start OCR Scan
                  </button>
                </div>
              </div>
            )}

            {/* Processing Step */}
            {(ocrStatus === 'uploading' || ocrStatus === 'processing') && (
              <div className="space-y-4 py-8 text-center">
                <Loader2 className="w-12 h-12 text-emerald-600 mx-auto animate-spin" />
                <h3 className="text-lg font-semibold text-slate-900">
                  {ocrStatus === 'uploading' ? 'Uploading document...' : 'Scanning & extracting questions...'}
                </h3>
                <p className="text-sm text-slate-500">
                  {ocrStage ? ocrStage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Processing document...'}
                </p>
                <div className="w-full bg-slate-200 rounded-full h-3 max-w-md mx-auto">
                  <div
                    className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-slate-600">{ocrProgress}% complete</p>
              </div>
            )}

            {/* Completed Step */}
            {ocrStatus === 'completed' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <h3 className="font-semibold">OCR Complete</h3>
                </div>
                <p className="text-sm text-slate-500">
                  Found {ocrExtractedQuestions.length} question(s) from the document. Review and edit before saving to the question bank.
                </p>
                {ocrExtractedQuestions.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {ocrExtractedQuestions.map((q, idx) => {
                      const hasOptions = q.options && q.options.length > 0;
                      const questionType = hasOptions ? 'MCQ' : 'Structured';
                      return (
                        <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{questionType}</span>
                            {q.confidence && (
                              <span className="text-xs text-slate-400">{Math.round(q.confidence * 100)}% confidence</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Q{idx + 1}: {q.text || q.question || 'No text extracted'}</p>
                          {hasOptions && (
                            <div className="space-y-1 ml-2">
                              {q.options.map((opt: any, i: number) => {
                                const optText = typeof opt === 'string' ? opt : opt.text;
                                const optId = typeof opt === 'string' ? String.fromCharCode(65 + i) : opt.id;
                                const isCorrect = typeof opt === 'object' && opt.isCorrect;
                                const correctAnswer = q.correctAnswer || q.answer;
                                const isThisCorrect = isCorrect ||
                                  (correctAnswer && (optId.toLowerCase() === correctAnswer.toLowerCase() || optText.toLowerCase().startsWith(correctAnswer.toLowerCase())));
                                return (
                                  <div key={i} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${isThisCorrect ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600'}`}>
                                    <span className="font-bold w-4">{String.fromCharCode(65 + i)}.</span>
                                    <span>{optText}</span>
                                    {isThisCorrect && <CheckCircle className="w-3 h-3 ml-auto text-emerald-600" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {!hasOptions && q.correctAnswer && (
                            <p className="text-xs text-emerald-600 mt-2 font-medium">Answer: {q.correctAnswer}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-amber-700 font-medium">No questions were automatically detected</p>
                    <p className="text-xs text-amber-600 mt-1">The document may need manual question entry. You can still save it to the library.</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowOcrModal(false); resetOcrState(); }}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSaveOcrQuestions}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Save to Question Bank
                  </button>
                </div>
              </div>
            )}

            {/* Error Step */}
            {ocrStatus === 'error' && (
              <div className="space-y-4 py-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="text-lg font-semibold text-slate-900">Processing Failed</h3>
                <p className="text-sm text-slate-500">{ocrErrorMessage}</p>
                <div className="flex gap-3 pt-2 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => { setShowOcrModal(false); resetOcrState(); }}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { setOcrStatus('idle'); setOcrErrorMessage(''); }}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Content</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-slate-700">{deleteModal.paperTitle}</p>
              <p className="text-xs text-slate-400 mt-1">All associated questions and data will be permanently removed.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, paperId: '', paperTitle: '' })}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleteLoading(true);
                  try {
                    await api.delete(`/digital-library/papers/${deleteModal.paperId}`);
                    toast.success('Content deleted successfully');
                    setDeleteModal({ open: false, paperId: '', paperTitle: '' });
                    fetchPapers();
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to delete content');
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
