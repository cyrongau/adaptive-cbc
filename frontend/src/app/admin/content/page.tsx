'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, CheckCircle, X, Eye, AlertTriangle, Search,
  XCircle, Clock, FileText, Download, Loader2, User, Calendar,
  Shield, ChevronLeft, ChevronRight, ExternalLink, MessageSquare,
  ListChecks, Image as ImageIcon, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_TABS = ['all', 'pending_review', 'published', 'rejected', 'draft'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  processing: { label: 'Processing', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  pending_review: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  published: { label: 'Published', color: 'text-[#7eda95]', bg: 'bg-[#7eda95]/10' },
  rejected: { label: 'Rejected', color: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10' },
  archived: { label: 'Archived', color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

export default function AdminContentPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [paperQuestions, setPaperQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; paperId: string }>({ open: false, paperId: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const limit = 15;

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      const res = await api.get('/digital-library/admin/papers', { params });
      setPapers(res.data.papers);
      setTotal(res.data.total);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [filter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        setPage(1);
        fetchPapers();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/digital-library/papers/${id}/publish`);
      toast.success('Paper approved and published');
      fetchPapers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve paper');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.paperId) return;
    setActionLoading(rejectModal.paperId);
    try {
      await api.post(`/digital-library/papers/${rejectModal.paperId}/reject`, { reason: rejectReason || undefined });
      toast.success('Paper rejected');
      setRejectModal({ open: false, paperId: '' });
      setRejectReason('');
      if (selectedPaper?.id === rejectModal.paperId) setShowViewModal(false);
      fetchPapers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject paper');
    } finally {
      setActionLoading(null);
    }
  };

  const openView = async (paper: any) => {
    setSelectedPaper(paper);
    setShowViewModal(true);
    setShowPreview(true);
    setShowQuestions(true);
    setPaperQuestions([]);

    if (paper.id) {
      setQuestionsLoading(true);
      try {
        const res = await api.get(`/digital-library/admin/papers/${paper.id}/questions`);
        setPaperQuestions(res.data);
      } catch (err) {
        setPaperQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getFileType = (url: string) => {
    if (!url) return null;
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff'].includes(ext || '')) return 'image';
    return null;
  };

  const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">Content Moderation</h2>
          <p className="text-sm text-[#becabd] mt-1">Review, preview, and approve learning materials across the platform.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              filter === f ? 'bg-[#7eda95] text-[#003919]' : 'bg-[#171f33] border border-[#3f4940] text-[#becabd] hover:bg-[#2d3449]'
            }`}
          >
            {f === 'all' ? 'All' : f === 'pending_review' ? 'Pending Review' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
        <input
          type="text"
          placeholder="Search papers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg pl-10 pr-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#7eda95] outline-none"
        />
      </div>

      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#7eda95] animate-spin" />
          </div>
        ) : papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#becabd]">
            <BookOpen className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm font-semibold">No content found</p>
            <p className="text-xs mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#131b2e] border-b border-[#3f4940]">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Title</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Grade</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Author</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3f4940]">
              {papers.map((paper) => {
                const sc = STATUS_CONFIG[paper.status] || STATUS_CONFIG.draft;
                const authorName = paper.createdByUser
                  ? `${paper.createdByUser.firstName} ${paper.createdByUser.lastName}`
                  : paper.createdBy?.slice(0, 8) || 'Unknown';
                return (
                  <tr key={paper.id} className="hover:bg-[#222a3d] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#7eda95] shrink-0" />
                        <span className="text-sm font-semibold text-[#dae2fd] truncate max-w-[200px]">{paper.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#becabd] capitalize">{paper.paperType?.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 text-sm text-[#becabd]">Grade {paper.grade}</td>
                    <td className="px-6 py-4 text-sm text-[#becabd]">{authorName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}>
                        {paper.status === 'published' ? <CheckCircle className="w-3 h-3" /> :
                         paper.status === 'rejected' ? <XCircle className="w-3 h-3" /> :
                         paper.status === 'pending_review' ? <Clock className="w-3 h-3" /> :
                         <FileText className="w-3 h-3" />}
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#becabd]">{new Date(paper.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openView(paper)}
                          className="p-1.5 rounded-lg hover:bg-[#2d3449] text-[#89ceff] transition-all"
                          title="Preview & review"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {paper.status === 'pending_review' || paper.status === 'draft' ? (
                          <>
                            <button
                              onClick={() => handleApprove(paper.id)}
                              disabled={actionLoading === paper.id}
                              className="p-1.5 rounded-lg hover:bg-[#2d3449] text-[#7eda95] transition-all disabled:opacity-50"
                              title="Approve"
                            >
                              {actionLoading === paper.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setRejectModal({ open: true, paperId: paper.id })}
                              disabled={actionLoading === paper.id}
                              className="p-1.5 rounded-lg hover:bg-[#2d3449] text-[#ffb4ab] transition-all disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#becabd]">
            Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg bg-[#171f33] border border-[#3f4940] text-[#becabd] hover:bg-[#2d3449] disabled:opacity-50 transition-all"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${page === pageNum ? 'bg-[#7eda95] text-[#003919]' : 'bg-[#171f33] border border-[#3f4940] text-[#becabd] hover:bg-[#2d3449]'}`}>{pageNum}</button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-[#171f33] border border-[#3f4940] text-[#becabd] hover:bg-[#2d3449] disabled:opacity-50 transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* View/Preview Modal */}
      {showViewModal && selectedPaper && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowViewModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#171f33] border border-[#3f4940] rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#3f4940] shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#7eda95]" />
                  {selectedPaper.title}
                </h3>
                <p className="text-sm text-[#becabd] mt-1">
                  Grade {selectedPaper.grade} • {selectedPaper.paperType?.replace(/_/g, ' ')} • {selectedPaper.year || 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[selectedPaper.status]?.bg} ${STATUS_CONFIG[selectedPaper.status]?.color}`}>
                  {STATUS_CONFIG[selectedPaper.status]?.label || selectedPaper.status}
                </span>
                <button onClick={() => setShowViewModal(false)} className="text-[#becabd] hover:text-[#dae2fd] transition-colors ml-2"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Left: Document Preview */}
                <div className="border-r border-[#3f4940]">
                  <button onClick={() => setShowPreview(!showPreview)} className="w-full flex items-center justify-between p-4 bg-[#131b2e] border-b border-[#3f4940] hover:bg-[#1a2540] transition-colors">
                    <span className="text-sm font-bold text-[#dae2fd] flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[#89ceff]" />Document Preview</span>
                    {showPreview ? <ChevronUp className="w-4 h-4 text-[#becabd]" /> : <ChevronDown className="w-4 h-4 text-[#becabd]" />}
                  </button>
                  {showPreview && (
                    <div className="p-4 min-h-[400px] flex flex-col items-center justify-center bg-[#0a0f1e]">
                      {selectedPaper.fileUrl ? (
                        getFileType(selectedPaper.fileUrl) === 'pdf' ? (
                          <iframe
                            src={getFullUrl(selectedPaper.fileUrl)}
                            className="w-full h-[600px] rounded-lg border border-[#3f4940]"
                            title="Document preview"
                          />
                        ) : getFileType(selectedPaper.fileUrl) === 'image' ? (
                          <img src={getFullUrl(selectedPaper.fileUrl)} alt={selectedPaper.title} className="max-w-full max-h-[600px] rounded-lg border border-[#3f4940] object-contain" />
                        ) : (
                          <div className="text-center">
                            <FileText className="w-16 h-16 text-[#6b7a99] mx-auto mb-4" />
                            <p className="text-sm text-[#becabd] mb-3">Preview not available for this file type</p>
                            <a href={getFullUrl(selectedPaper.fileUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[#47a263] text-[#003919] rounded-lg text-sm font-medium hover:bg-[#3d8c54]">
                              <ExternalLink className="w-4 h-4" />
                              Open in New Tab
                            </a>
                          </div>
                        )
                      ) : selectedPaper.thumbnailUrl ? (
                        <img src={getFullUrl(selectedPaper.thumbnailUrl)} alt={selectedPaper.title} className="max-w-full max-h-[400px] rounded-lg border border-[#3f4940]" />
                      ) : (
                        <div className="text-center">
                          <FileText className="w-16 h-16 text-[#6b7a99] mx-auto mb-4" />
                          <p className="text-sm text-[#becabd]">No document attached</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Details & Questions */}
                <div className="flex flex-col">
                  {/* Metadata */}
                  <div className="p-4 border-b border-[#3f4940]">
                    <h4 className="text-sm font-bold text-[#dae2fd] mb-3">Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#131b2e] rounded-lg p-2">
                        <p className="text-xs text-[#becabd]">Author</p>
                        <p className="text-sm text-[#dae2fd]">{selectedPaper.createdByUser ? `${selectedPaper.createdByUser.firstName} ${selectedPaper.createdByUser.lastName}` : 'Unknown'}</p>
                      </div>
                      <div className="bg-[#131b2e] rounded-lg p-2">
                        <p className="text-xs text-[#becabd]">Created</p>
                        <p className="text-sm text-[#dae2fd]">{new Date(selectedPaper.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-[#131b2e] rounded-lg p-2">
                        <p className="text-xs text-[#becabd]">Downloads</p>
                        <p className="text-sm text-[#dae2fd]">{selectedPaper.downloadCount || 0}</p>
                      </div>
                      <div className="bg-[#131b2e] rounded-lg p-2">
                        <p className="text-xs text-[#becabd]">Pages</p>
                        <p className="text-sm text-[#dae2fd]">{selectedPaper.pageCount || 'N/A'}</p>
                      </div>
                      {selectedPaper.isPremium && (
                        <div className="bg-[#131b2e] rounded-lg p-2 col-span-2">
                          <p className="text-xs text-[#becabd]">Premium — KES {selectedPaper.price}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extracted Questions */}
                  <button onClick={() => setShowQuestions(!showQuestions)} className="w-full flex items-center justify-between p-4 bg-[#131b2e] border-b border-[#3f4940] hover:bg-[#1a2540] transition-colors shrink-0">
                    <span className="text-sm font-bold text-[#dae2fd] flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-[#7eda95]" />
                      Extracted Questions ({questionsLoading ? '...' : paperQuestions.length})
                    </span>
                    {showQuestions ? <ChevronUp className="w-4 h-4 text-[#becabd]" /> : <ChevronDown className="w-4 h-4 text-[#becabd]" />}
                  </button>
                  {showQuestions && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {questionsLoading ? (
                        <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-[#7eda95] animate-spin" /></div>
                      ) : paperQuestions.length > 0 ? (
                        paperQuestions.map((q, idx) => (
                          <div key={q.id || idx} className="bg-[#131b2e] rounded-lg p-3 border border-[#3f4940]">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-[#7eda95] bg-[#7eda95]/10 px-2 py-0.5 rounded-full">Q{idx + 1}</span>
                              {q.options && q.options.length > 0 && (
                                <span className="text-xs text-[#89ceff] bg-[#89ceff]/10 px-2 py-0.5 rounded-full">MCQ</span>
                              )}
                              {q.reviewStatus && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  q.reviewStatus === 'approved' ? 'text-[#7eda95] bg-[#7eda95]/10' :
                                  q.reviewStatus === 'rejected' ? 'text-[#ffb4ab] bg-[#ffb4ab]/10' :
                                  'text-[#f0b860] bg-[#f0b860]/10'
                                }`}>
                                  {q.reviewStatus.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[#dae2fd] mb-2">{q.extractedText || q.questionText || 'No text extracted'}</p>
                            {q.options && q.options.length > 0 && (
                              <div className="space-y-1 ml-2">
                                {q.options.map((opt: any, i: number) => {
                                  const optText = typeof opt === 'string' ? opt : opt.text;
                                  const isCorrect = typeof opt === 'object' && opt.isCorrect;
                                  return (
                                    <div key={i} className={`text-xs px-2 py-1 rounded flex items-center gap-2 ${isCorrect ? 'bg-[#7eda95]/10 text-[#7eda95]' : 'text-[#becabd]'}`}>
                                      <span className="font-bold w-4">{String.fromCharCode(65 + i)}.</span>
                                      <span>{optText}</span>
                                      {isCorrect && <CheckCircle className="w-3 h-3 ml-auto" />}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {q.correctAnswer && !q.options?.length && (
                              <p className="text-xs text-[#7eda95] mt-1">Answer: {q.correctAnswer}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="w-10 h-10 text-[#6b7a99] mx-auto mb-3" />
                          <p className="text-sm text-[#becabd]">No questions extracted yet</p>
                          <p className="text-xs text-[#6b7a99] mt-1">Run OCR on this document to extract questions</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#3f4940] shrink-0">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 border border-[#3f4940] text-[#becabd] text-xs font-semibold rounded-lg hover:bg-[#2d3449] transition-all">Close</button>
              {(selectedPaper.status === 'pending_review' || selectedPaper.status === 'draft') && (
                <>
                  <button onClick={() => { setShowViewModal(false); setRejectModal({ open: true, paperId: selectedPaper.id }); }} disabled={actionLoading === selectedPaper.id} className="px-4 py-2 bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-[#ffb4ab]/20 transition-all disabled:opacity-50"><XCircle className="w-4 h-4" />Reject</button>
                  <button onClick={() => { setShowViewModal(false); handleApprove(selectedPaper.id); }} disabled={actionLoading === selectedPaper.id} className="px-4 py-2 bg-[#7eda95] text-[#003919] text-xs font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50">{actionLoading === selectedPaper.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Approve & Publish</button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setRejectModal({ open: false, paperId: '' })}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#171f33] border border-[#3f4940] rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#ffb4ab]/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-[#ffb4ab]" /></div>
              <div>
                <h3 className="text-lg font-bold text-[#dae2fd]">Reject Paper</h3>
                <p className="text-sm text-[#becabd]">Provide a reason for rejection (optional).</p>
              </div>
            </div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g., Inappropriate content, low quality, duplicates..." rows={3} className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#ffb4ab] outline-none resize-none" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setRejectModal({ open: false, paperId: '' })} className="px-4 py-2 border border-[#3f4940] text-[#becabd] text-xs font-semibold rounded-lg hover:bg-[#2d3449] transition-all">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading === rejectModal.paperId} className="px-4 py-2 bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-[#ffb4ab]/20 transition-all disabled:opacity-50">{actionLoading === rejectModal.paperId ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}Reject</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
