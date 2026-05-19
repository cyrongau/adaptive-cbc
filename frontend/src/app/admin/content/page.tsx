'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, CheckCircle, X, Eye, AlertTriangle, Search,
  XCircle, Clock, FileText, Download, Loader2, User, Calendar,
  Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

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

  const openView = (paper: any) => {
    setSelectedPaper(paper);
    setShowViewModal(true);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">Content Moderation</h2>
          <p className="text-sm text-[#becabd] mt-1">Review, approve, and manage learning materials across the platform.</p>
        </div>
      </div>

      {/* Filter Tabs */}
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

      {/* Search */}
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

      {/* Table */}
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
                          title="View details"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#becabd]">
            Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-[#171f33] border border-[#3f4940] text-[#becabd] hover:bg-[#2d3449] disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                    page === pageNum ? 'bg-[#7eda95] text-[#003919]' : 'bg-[#171f33] border border-[#3f4940] text-[#becabd] hover:bg-[#2d3449]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-[#171f33] border border-[#3f4940] text-[#becabd] hover:bg-[#2d3449] disabled:opacity-50 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedPaper && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowViewModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#171f33] border border-[#3f4940] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[#3f4940]">
              <h3 className="text-lg font-bold text-[#dae2fd] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#7eda95]" />
                Paper Details
              </h3>
              <button onClick={() => setShowViewModal(false)} className="text-[#becabd] hover:text-[#dae2fd] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-xl font-bold text-[#dae2fd]">{selectedPaper.title}</h4>
                {selectedPaper.description && (
                  <p className="text-sm text-[#becabd] mt-1">{selectedPaper.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#131b2e] rounded-lg p-3">
                  <p className="text-xs text-[#becabd] uppercase tracking-wider font-semibold mb-1">Type</p>
                  <p className="text-sm text-[#dae2fd] capitalize">{selectedPaper.paperType?.replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-[#131b2e] rounded-lg p-3">
                  <p className="text-xs text-[#becabd] uppercase tracking-wider font-semibold mb-1">Grade</p>
                  <p className="text-sm text-[#dae2fd]">Grade {selectedPaper.grade}</p>
                </div>
                <div className="bg-[#131b2e] rounded-lg p-3">
                  <p className="text-xs text-[#becabd] uppercase tracking-wider font-semibold mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[selectedPaper.status]?.bg} ${STATUS_CONFIG[selectedPaper.status]?.color}`}>
                    {STATUS_CONFIG[selectedPaper.status]?.label || selectedPaper.status}
                  </span>
                </div>
                <div className="bg-[#131b2e] rounded-lg p-3">
                  <p className="text-xs text-[#becabd] uppercase tracking-wider font-semibold mb-1">Visibility</p>
                  <p className="text-sm text-[#dae2fd] capitalize">{selectedPaper.visibility?.replace(/_/g, ' ')}</p>
                </div>
                {selectedPaper.year && (
                  <div className="bg-[#131b2e] rounded-lg p-3">
                    <p className="text-xs text-[#becabd] uppercase tracking-wider font-semibold mb-1">Year</p>
                    <p className="text-sm text-[#dae2fd]">{selectedPaper.year}</p>
                  </div>
                )}
                {selectedPaper.term && (
                  <div className="bg-[#131b2e] rounded-lg p-3">
                    <p className="text-xs text-[#becabd] uppercase tracking-wider font-semibold mb-1">Term</p>
                    <p className="text-sm text-[#dae2fd]">Term {selectedPaper.term}</p>
                  </div>
                )}
                <div className="bg-[#131b2e] rounded-lg p-3">
                  <p className="text-xs text-[#becabd] uppercase tracking-wider font-semibold mb-1">Author</p>
                  <p className="text-sm text-[#dae2fd]">
                    {selectedPaper.createdByUser
                      ? `${selectedPaper.createdByUser.firstName} ${selectedPaper.createdByUser.lastName}`
                      : 'Unknown'}
                  </p>
                </div>
                <div className="bg-[#131b2e] rounded-lg p-3">
                  <p className="text-xs text-[#becabd] uppercase tracking-wider font-semibold mb-1">Created</p>
                  <p className="text-sm text-[#dae2fd]">{new Date(selectedPaper.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedPaper.verifiedByUser && (
                  <div className="bg-[#131b2e] rounded-lg p-3">
                    <p className="text-xs text-[#becabd] uppercase tracking-wider font-semibold mb-1">Reviewed By</p>
                    <p className="text-sm text-[#dae2fd]">
                      {selectedPaper.verifiedByUser.firstName} {selectedPaper.verifiedByUser.lastName}
                    </p>
                  </div>
                )}
                {selectedPaper.publishedAt && (
                  <div className="bg-[#131b2e] rounded-lg p-3">
                    <p className="text-xs text-[#becabd] uppercase tracking-wider font-semibold mb-1">Published</p>
                    <p className="text-sm text-[#dae2fd]">{new Date(selectedPaper.publishedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedPaper.metadata?.rejectionReason && (
                  <div className="bg-[#131b2e] rounded-lg p-3 col-span-2">
                    <p className="text-xs text-[#becabd] uppercase tracking-wider font-semibold mb-1">Rejection Reason</p>
                    <p className="text-sm text-[#ffb4ab]">{selectedPaper.metadata.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-[#becabd]">
                <Download className="w-4 h-4" />
                <span>{selectedPaper.downloadCount || 0} downloads</span>
                <Eye className="w-4 h-4 ml-3" />
                <span>{selectedPaper.viewCount || 0} views</span>
                {selectedPaper.isPremium && (
                  <>
                    <Shield className="w-4 h-4 ml-3 text-amber-400" />
                    <span className="text-amber-400">Premium — KES {selectedPaper.price}</span>
                  </>
                )}
              </div>

              {selectedPaper.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPaper.tags.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-[#131b2e] text-[#becabd] text-xs rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#3f4940]">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-[#3f4940] text-[#becabd] text-xs font-semibold rounded-lg hover:bg-[#2d3449] transition-all"
              >
                Close
              </button>
              {(selectedPaper.status === 'pending_review' || selectedPaper.status === 'draft') && (
                <>
                  <button
                    onClick={() => { setShowViewModal(false); handleApprove(selectedPaper.id); }}
                    disabled={actionLoading === selectedPaper.id}
                    className="px-4 py-2 bg-[#7eda95] text-[#003919] text-xs font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {actionLoading === selectedPaper.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve & Publish
                  </button>
                  <button
                    onClick={() => { setShowViewModal(false); setRejectModal({ open: true, paperId: selectedPaper.id }); }}
                    disabled={actionLoading === selectedPaper.id}
                    className="px-4 py-2 bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-[#ffb4ab]/20 transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setRejectModal({ open: false, paperId: '' })}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#171f33] border border-[#3f4940] rounded-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#ffb4ab]/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#ffb4ab]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#dae2fd]">Reject Paper</h3>
                <p className="text-sm text-[#becabd]">Provide a reason for rejection (optional).</p>
              </div>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Inappropriate content, low quality, duplicates..."
              rows={3}
              className="w-full bg-[#060e20] border border-[#3f4940] rounded-lg px-4 py-2.5 text-[#dae2fd] text-sm focus:border-[#ffb4ab] outline-none resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModal({ open: false, paperId: '' })}
                className="px-4 py-2 border border-[#3f4940] text-[#becabd] text-xs font-semibold rounded-lg hover:bg-[#2d3449] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.paperId}
                className="px-4 py-2 bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 text-xs font-semibold rounded-lg flex items-center gap-2 hover:bg-[#ffb4ab]/20 transition-all disabled:opacity-50"
              >
                {actionLoading === rejectModal.paperId ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
