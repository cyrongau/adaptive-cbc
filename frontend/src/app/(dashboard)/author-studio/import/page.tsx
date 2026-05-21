'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
  Scan,
  X
} from 'lucide-react';
import { useQuotaStatus } from '@/hooks/useQuotaStatus';
import { useAuthStore } from '@/store/authStore';

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CBC_SUBJECTS = [
  'Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 
  'Creative Arts', 'Agriculture', 'Pre-Technical Studies'
];

export default function AuthorStudioImport() {
  const { user } = useAuthStore();
  const { quota } = useQuotaStatus();
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrJobId, setOcrJobId] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [ocrStage, setOcrStage] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrExtractedQuestions, setOcrExtractedQuestions] = useState<any[]>([]);
  const [ocrErrorMessage, setOcrErrorMessage] = useState('');
  const [ocrMetadata, setOcrMetadata] = useState({ title: '', subjectId: '', grade: 7, paperType: 'past_paper', year: new Date().getFullYear(), term: 1 });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
    } catch {
      setSubjects([]);
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
    if (quota?.ocr?.isExceeded) {
      toast.error(`OCR quota exceeded. ${quota.ocr.remaining} pages remaining today.`);
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
      if (ocrMetadata.title) {
        formData.append('title', ocrMetadata.title);
      }
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
          const normalized = normalizeOcrQuestions(result?.questions || []);
          setOcrExtractedQuestions(normalized);
          
          // Store extracted questions in sessionStorage so create/page.tsx can access them
          normalized.forEach((q: any, i: number) => {
            sessionStorage.setItem(`draft_question_${jobId}_${i}`, JSON.stringify(q));
          });

          if (result?.is_duplicate) {
            toast('This document was previously uploaded. Loaded from cache.', { icon: 'ℹ️' });
          }
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

  const normalizeOcrQuestions = (questions: any[]) =>
    questions.map((q: any, idx: number) => {
      const options = Array.isArray(q.options)
        ? q.options.map((opt: any, optionIndex: number) => ({
            id: opt?.id || String.fromCharCode(65 + optionIndex),
            text: typeof opt === 'string' ? opt : opt?.text || '',
            isCorrect: typeof opt === 'object' ? !!opt.isCorrect : false,
          }))
        : [];

      const correctAnswer = q.correctAnswer || q.answer || options.find((opt: any) => opt.isCorrect)?.id || '';

      return {
        pageNumber: q.pageNumber || 1,
        questionNumber: q.questionNumber || idx + 1,
        questionText: q.questionText || q.text || q.question || '',
        extractedText: q.extractedText || q.text || q.question || '',
        options,
        correctAnswer,
        confidence: q.confidence || 0,
      };
    });

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/author-studio" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Import from Scan (Draft)</h1>
          <p className="text-slate-500 text-sm">Upload a test paper. AI will extract draft questions for you to review and edit.</p>
        </div>
      </div>

      {(ocrStatus === 'idle' || ocrStatus === 'error') && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm text-center border-dashed"
        >
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Upload Test Paper</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Upload a PDF or image of a test paper. The OCR assistant will extract the text and create draft questions. 
            <br/><br/>
            <strong className="text-amber-600">Note: All extracted questions must be manually reviewed and aligned to the CBC curriculum before submission.</strong>
          </p>

          {ocrErrorMessage && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 justify-center text-sm font-medium">
              <AlertCircle className="w-5 h-5" />
              {ocrErrorMessage}
            </div>
          )}

          {/* Metadata fields */}
          <div className="text-left mb-8 max-w-lg mx-auto space-y-4">
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
            </div>

            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-[#47a263] transition-colors cursor-pointer"
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
            </div>
          </div>
          
          <button 
            onClick={handleOcrUpload}
            disabled={!ocrFile || !ocrMetadata.subjectId}
            className="px-8 py-3 bg-[#47a263] text-white font-medium rounded-xl shadow-sm hover:bg-[#3d8b55] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start OCR Scan
          </button>
        </motion.div>
      )}

      {(ocrStatus === 'uploading' || ocrStatus === 'processing') && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <Loader2 className="w-12 h-12 text-[#47a263] animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Scanning Document...</h2>
          <p className="text-slate-500 mb-4">{ocrStage || 'Extracting text and identifying question boundaries...'}</p>
          <div className="w-full max-w-md mx-auto bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
            <div 
              className="bg-[#47a263] h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${ocrProgress}%` }}
            />
          </div>
          <p className="text-sm font-medium text-slate-600">{ocrProgress}%</p>
        </div>
      )}

      {ocrStatus === 'completed' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-green-900">Extraction Complete</h3>
              <p className="text-green-800 text-sm mt-1">
                Successfully extracted {ocrExtractedQuestions.length} potential questions from the document. Please review each draft, apply CBC taxonomy, and finalize the content.
              </p>
            </div>
            <button
              onClick={() => {
                setOcrStatus('idle');
                setOcrFile(null);
                setOcrExtractedQuestions([]);
              }}
              className="ml-auto px-4 py-2 bg-white text-green-700 text-sm font-medium border border-green-200 rounded-lg hover:bg-green-50"
            >
              Scan Another
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
            {ocrExtractedQuestions.length > 0 ? (
              ocrExtractedQuestions.map((q, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                      Draft
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Extracted Question {i + 1}</p>
                      <p className="text-sm text-slate-500 line-clamp-1">{q.questionText || 'No text extracted'}</p>
                    </div>
                  </div>
                  <Link
                    href={`/author-studio/create?source=ocr&draftId=draft_question_${ocrJobId}_${i}`}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    Review & Edit
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                No questions were detected in this document.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
