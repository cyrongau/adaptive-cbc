'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Edit3, Clock, History, AlertTriangle, CheckCircle,
  Loader2, ChevronDown, BookOpen, BarChart, FileText,
} from 'lucide-react';

interface Version {
  id: string;
  version: number;
  snapshot: any;
  changedBy: string;
  changeReason?: string;
  createdAt: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  status: string;
  grade: number;
  subjectId: string;
  strandId?: string;
  subStrandId?: string;
  learningOutcomeId?: string;
  marks: number;
  estimatedTimeSeconds?: number;
  bloomsTaxonomy?: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  solutionSteps?: { step: number; text: string }[];
  markingScheme?: string;
  hints?: string[];
  competencyTags?: string[];
  sourceType: string;
  version: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export default function QuestionEditor({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  useEffect(() => {
    fetchQuestion();
  }, [params.id]);

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const [questionRes, versionsRes] = await Promise.all([
        api.get(`/questions/${params.id}`),
        api.get(`/questions/${params.id}/versions`).catch(() => ({ data: [] })),
      ]);
      setQuestion(questionRes.data);
      setVersions(versionsRes.data || []);
    } catch {
      toast.error('Failed to load question');
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      draft: 'text-blue-600 bg-blue-100',
      pending_review: 'text-amber-600 bg-amber-100',
      approved: 'text-green-600 bg-green-100',
      published: 'text-[#47a263] bg-[#47a263]/10',
      flagged: 'text-red-600 bg-red-100',
      archived: 'text-slate-500 bg-slate-100',
    };
    return map[status] || 'text-slate-500 bg-slate-100';
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      approved: 'Approved',
      published: 'Published',
      flagged: 'Flagged',
      archived: 'Archived',
    };
    return map[status] || status;
  };

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      multiple_choice: 'Multiple Choice',
      true_false: 'True/False',
      short_answer: 'Short Answer',
      long_answer: 'Long Answer',
      mathematical: 'Mathematical',
      matching: 'Matching',
      fill_blank: 'Fill in Blank',
      diagram_labeling: 'Diagram Labeling',
      practical: 'Practical',
      comprehension: 'Comprehension',
      table_interpretation: 'Table',
      graph_analysis: 'Graph Analysis',
    };
    return map[type] || type;
  };

  const handleVersionSelect = async (version: Version) => {
    if (selectedVersion?.id === version.id) {
      setSelectedVersion(null);
      return;
    }
    setSelectedVersion(version);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto pb-12 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading question...
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-5xl mx-auto pb-12 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/author-studio" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
        </div>
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Question Not Found</h2>
          <p className="text-slate-500 mb-4">This question does not exist or has been removed.</p>
          <Link
            href="/author-studio"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#47a263] text-white rounded-lg hover:bg-[#3d8c55] transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Studio
          </Link>
        </div>
      </div>
    );
  }

  const displayData = selectedVersion ? selectedVersion.snapshot : question;

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/author-studio" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${statusColor(question.status)}`}>
                {statusLabel(question.status)}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                Grade {question.grade}
              </span>
              <span className="text-xs font-medium text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md">
                v{question.version}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              {question.content.replace(/<[^>]*>?/gm, '').slice(0, 60)}
              {question.content.length > 60 ? '...' : ''}
            </h1>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              <History className="w-4 h-4" />
              Version History
              {versions.length > 0 && (
                <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">{versions.length}</span>
              )}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showVersions && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-80 overflow-y-auto">
                <div className="p-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-700">Version History</h4>
                </div>
                {versions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">No version history</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {versions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleVersionSelect(v)}
                        className={`w-full text-left p-3 hover:bg-slate-50 transition-colors ${
                          selectedVersion?.id === v.id ? 'bg-[#47a263]/5' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-800">Version {v.version}</span>
                          <span className="text-xs text-slate-400">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {v.changeReason && (
                          <p className="text-xs text-slate-500 mt-0.5">{v.changeReason}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {question.status === 'draft' || question.status === 'flagged' ? (
            <Link
              href={`/author-studio/create?edit=${params.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-[#47a263] text-white rounded-lg hover:bg-[#3d8c55] transition-colors font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Edit Question
            </Link>
          ) : null}
        </div>
      </div>

      {selectedVersion && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <History className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-amber-700">
            Viewing version {selectedVersion.version} — created {new Date(selectedVersion.createdAt).toLocaleString()}
          </span>
          <button
            onClick={() => setSelectedVersion(null)}
            className="ml-auto text-sm font-medium text-amber-600 hover:text-amber-800"
          >
            Show Latest
          </button>
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Question Content */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Question Content</h3>
            <div className="prose max-w-none text-slate-800">
              <p>{displayData.content}</p>
            </div>

            {displayData.options && displayData.options.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Options</h4>
                <ul className="space-y-2">
                  {displayData.options.map((opt: any, idx: number) => (
                    <li
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        opt.isCorrect ? 'border-[#47a263] bg-[#47a263]/5' : 'border-slate-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        opt.isCorrect ? 'bg-[#47a263] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="font-medium">{opt.text}</span>
                      {opt.isCorrect && <CheckCircle className="w-4 h-4 text-[#47a263] ml-auto" />}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {displayData.correctAnswer && !displayData.options && (
              <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
                <span className="text-sm font-medium text-green-700">
                  Answer: {displayData.correctAnswer}
                </span>
              </div>
            )}
          </div>

          {/* Solution & Explanation */}
          {displayData.solutionSteps?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Solution</h3>
              <div className="space-y-3">
                {displayData.solutionSteps.map((step: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#47a263]/10 text-[#47a263] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {step.step}
                    </div>
                    <p className="text-sm text-slate-700">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayData.explanation && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Explanation</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-slate-700 text-sm">{displayData.explanation}</p>
              </div>
            </div>
          )}

          {displayData.hints?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Hints</h3>
              <div className="space-y-2">
                {displayData.hints.map((hint: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-amber-500 font-bold text-sm">H{idx + 1}:</span>
                    <span className="text-sm text-amber-800">{hint}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayData.markingScheme && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Marking Scheme</h3>
              <p className="text-sm text-slate-700">{displayData.markingScheme}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-slate-400" />
              Classification
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-medium text-slate-800">{typeLabel(question.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Difficulty</span>
                <span className={`font-medium capitalize ${
                  question.difficulty === 'easy' ? 'text-green-600' :
                  question.difficulty === 'hard' ? 'text-red-600' :
                  'text-amber-600'
                }`}>{question.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marks</span>
                <span className="font-medium text-slate-800">{question.marks}</span>
              </div>
              {question.estimatedTimeSeconds && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Time</span>
                  <span className="font-medium text-slate-800">{question.estimatedTimeSeconds}s</span>
                </div>
              )}
              {question.bloomsTaxonomy && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Bloom's</span>
                  <span className="font-medium text-slate-800 capitalize">{question.bloomsTaxonomy}</span>
                </div>
              )}
              {question.competencyTags && question.competencyTags.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block mb-2">Competencies</span>
                  <div className="flex flex-wrap gap-1">
                    {question.competencyTags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-[#47a263]/10 text-[#47a263] rounded text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-400" />
              Curriculum
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Grade</span>
                <span className="font-medium text-slate-800">{question.grade}</span>
              </div>
              {question.strandId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Strand</span>
                  <span className="font-medium text-slate-800 text-right max-w-[50%] truncate" title={question.strandId}>
                    {question.strandId.slice(0, 8)}...
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Source</span>
                <span className="font-medium text-slate-800 capitalize">{question.sourceType.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="font-medium text-slate-800">{new Date(question.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Updated</span>
                <span className="font-medium text-slate-800">{new Date(question.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Version</span>
                <span className="font-medium text-slate-800">{question.version}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
