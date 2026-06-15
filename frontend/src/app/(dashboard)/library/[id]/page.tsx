'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, FileText, Download, Eye, Share2, Clock, BookOpen,
  Calendar, User, Tag, ChevronRight, ExternalLink, Star, Maximize2,
} from 'lucide-react';

const PAPER_TYPE_MAP: Record<string, string> = {
  past_paper: 'Past Paper',
  revision_kit: 'Revision Kit',
  mock_exam: 'Mock Exam',
  work_sheet: 'Worksheet',
  notes: 'Notes',
};

export default function LibraryItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [rating, setRating] = useState<{ averageRating: number; totalReviews: number }>({ averageRating: 0, totalReviews: 0 });
  const [relatedDocs, setRelatedDocs] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectName, setSubjectName] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paperRes, ratingRes, subjectsRes, relatedRes, questionsRes] = await Promise.allSettled([
          api.get(`/digital-library/papers/${params.id}`),
          api.get(`/digital-library/papers/${params.id}/rating`),
          api.get('/subjects'),
          api.get('/digital-library/papers', { params: { limit: 3 } }),
          api.get(`/digital-library/papers/${params.id}/questions`),
        ]);

        if (paperRes.status === 'fulfilled') {
          setItem(paperRes.value.data);
        }

        if (ratingRes.status === 'fulfilled') {
          setRating(ratingRes.value.data);
        }

        if (subjectsRes.status === 'fulfilled') {
          const subjects = subjectsRes.value.data;
          if (paperRes.status === 'fulfilled') {
            const subject = subjects.find((s: any) => s.id === paperRes.value.data.subjectId);
            setSubjectName(subject?.name || 'Unknown');
          }
        }

        if (relatedRes.status === 'fulfilled' && paperRes.status === 'fulfilled') {
          const papers = relatedRes.value.data.papers || [];
          const filtered = papers.filter((p: any) => p.id !== params.id).slice(0, 3);
          const related = filtered.map((p: any) => {
            const subject = subjectsRes.status === 'fulfilled'
              ? subjectsRes.value.data.find((s: any) => s.id === p.subjectId)
              : null;
            return { ...p, subjectName: subject?.name || 'Unknown' };
          });
          setRelatedDocs(related);
        }

        if (questionsRes.status === 'fulfilled') {
          setQuestions(questionsRes.value.data);
        }
      } catch (error) {
        toast.error('Failed to load document details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleDownload = async () => {
    if (!item) return;
    setDownloading(true);
    try {
      const res = await api.post(`/digital-library/papers/${params.id}/download`);
      const paper = res.data;
      setItem(paper);

      const url = paper.fileUrl;
      if (url) {
        const isPdf = url.match(/\.pdf$/i);
        if (isPdf) {
          window.open(url, '_blank');
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = paper.metadata?.originalFileName || `download.${url.split('.').pop()}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        toast.success('Download started');
      } else {
        toast.error('No file available for download');
      }
    } catch {
      toast.error('Failed to download');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: item?.title || 'Digital Library Document',
      text: `Check out this document: ${item?.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const openPreview = () => {
    if (item?.fileUrl) {
      window.open(item.fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/library" className="hover:text-[#47a263] transition-colors font-medium">Digital Library</Link>
          <ChevronRight className="w-4 h-4" />
          <div className="h-4 bg-slate-200 rounded w-48 animate-pulse" />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="h-5 bg-slate-200 rounded-full w-20" />
                    <div className="h-5 bg-slate-200 rounded-full w-24" />
                    <div className="h-5 bg-slate-200 rounded-full w-16" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded w-3/4 mt-2" />
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-full mb-2" />
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-6" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center space-y-1">
                    <div className="h-3 bg-slate-200 rounded w-12 mx-auto" />
                    <div className="h-4 bg-slate-200 rounded w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="w-full aspect-[3/4] bg-slate-200 rounded-xl mb-4" />
              <div className="h-5 bg-slate-200 rounded w-24 mx-auto mb-4" />
              <div className="space-y-3">
                <div className="h-10 bg-slate-200 rounded-xl" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/library" className="hover:text-[#47a263] transition-colors font-medium">Digital Library</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-700 font-semibold">Not Found</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Document not found.</p>
          <Link href="/library" className="text-[#47a263] font-medium mt-2 inline-block">Back to Library</Link>
        </div>
      </div>
    );
  }

  const termLabel = item.term ? `Term ${item.term}` : 'N/A';
  const yearLabel = item.year || 'N/A';
  const fileSize = item.metadata?.fileSize 
    ? `${(item.metadata.fileSize / 1024 / 1024).toFixed(1)} MB` 
    : item.pageCount 
      ? `~${(item.pageCount * 0.45).toFixed(1)} MB (est)` 
      : 'Unknown';
  const isImage = item.fileUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
  const isPdf = item.fileUrl?.endsWith('.pdf');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/library" className="hover:text-[#47a263] transition-colors font-medium">Digital Library</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-700 font-semibold truncate">{item.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Description, Author, Similar Content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-[#47a263]/10 flex items-center justify-center shrink-0">
                <FileText className="w-7 h-7 text-[#47a263]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-[#47a263]/10 text-[#47a263] text-xs font-bold rounded-full">{PAPER_TYPE_MAP[item.paperType] || item.paperType}</span>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">{subjectName}</span>
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full">Grade {item.grade}</span>
                  {item.isPremium && <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Premium</span>}
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 mt-2">{item.title}</h1>

                {/* Author info inline */}
                {item.createdByUser && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <User className="w-4 h-4" />
                    <span>Uploaded by <strong className="text-slate-700">{item.createdByUser.firstName} {item.createdByUser.lastName}</strong></span>
                    <span className="text-slate-300">|</span>
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {item.description && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-900 mb-2">Description</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
              {[
                { icon: FileText, label: 'File Size', value: fileSize },
                { icon: Clock, label: 'Pages', value: `${item.pageCount || 0} pages` },
                { icon: Calendar, label: 'Term', value: termLabel },
                { icon: BookOpen, label: 'Year', value: yearLabel },
              ].map((meta, i) => (
                <div key={i} className="text-center">
                  <meta.icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 font-medium uppercase">{meta.label}</p>
                  <p className="text-sm font-bold text-slate-900">{meta.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {questions && questions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Content & Questions ({questions.length})</h2>
              <div className="space-y-4">
                {questions.map((q: any, i: number) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex gap-3">
                      <span className="font-bold text-slate-900 shrink-0">{q.questionNumber || i + 1}.</span>
                      <div className="flex-1 space-y-3">
                        <p className="text-slate-700 font-medium whitespace-pre-wrap">{q.questionText}</p>
                        {q.imageUrls && q.imageUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {q.imageUrls.map((url: string, idx: number) => (
                              <img key={idx} src={url} alt="Question figure" className="max-h-40 object-contain rounded-lg border border-slate-200 bg-white" />
                            ))}
                          </div>
                        )}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {q.options.map((opt: any) => {
                              const isCorrect = q.correctAnswer && opt.id.toLowerCase() === q.correctAnswer.toLowerCase();
                              return (
                                <div key={opt.id} className={`p-2 rounded-lg border text-sm ${isCorrect ? 'bg-green-50 border-green-200 text-green-800 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}>
                                  <span className="font-semibold mr-2">{opt.id.toUpperCase()}.</span> {opt.text}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {q.correctAnswer && (!q.options || q.options.length === 0) && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Answer</p>
                            <p className="text-sm text-blue-900 whitespace-pre-wrap">{q.correctAnswer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {item.tags && item.tags.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">{tag}</span>
                ))}
              </div>
            </motion.div>
          )}

          {relatedDocs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Similar Content</h2>
              <div className="space-y-3">
                {relatedDocs.map((doc: any) => (
                  <Link key={doc.id} href={`/library/${doc.id}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#47a263]/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#47a263]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{doc.title}</p>
                      <p className="text-xs text-slate-400">{doc.subjectName} &bull; {PAPER_TYPE_MAP[doc.paperType] || doc.paperType}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Preview + Actions */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
            <div className="text-center mb-6">
              <div className="w-full aspect-[3/4] bg-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative border border-slate-200 group">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt="Document Preview" className="w-full h-full object-cover cursor-pointer" onClick={openPreview} />
                ) : isImage ? (
                  <img src={item.fileUrl} alt="Document Preview" className="w-full h-full object-cover cursor-pointer" onClick={openPreview} />
                ) : isPdf ? (
                  <iframe src={`${item.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full border-0" title="PDF Preview" />
                ) : (
                  <FileText className="w-16 h-16 text-slate-300" />
                )}

                {item.fileUrl && (
                  <button onClick={openPreview}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {item.fileUrl && !isImage && !isPdf && (
                <button onClick={openPreview} className="text-xs text-[#47a263] font-medium hover:underline mb-2 flex items-center gap-1 justify-center">
                  <ExternalLink className="w-3 h-3" /> Open in new tab
                </button>
              )}

              {rating.totalReviews > 0 && (
                <div className="flex items-center justify-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">({rating.totalReviews})</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button onClick={handleDownload} disabled={downloading}
                className="w-full py-3 bg-[#47a263] text-white font-extrabold text-sm rounded-xl hover:bg-[#3d8b55] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60">
                <Download className="w-4 h-4" /> {downloading ? 'Downloading...' : 'Download'}
              </button>
              <button onClick={handleShare} className="w-full py-3 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            <div className="space-y-3 mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Eye className="w-4 h-4" /> Views</span>
                <span className="font-semibold text-slate-900">{item.viewCount?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Download className="w-4 h-4" /> Downloads</span>
                <span className="font-semibold text-slate-900">{item.downloadCount?.toLocaleString() || 0}</span>
              </div>
              {item.createdByUser && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><User className="w-4 h-4" /> Uploaded by</span>
                  <span className="font-semibold text-slate-900 text-xs">{item.createdByUser.firstName} {item.createdByUser.lastName}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Uploaded</span>
                <span className="font-semibold text-slate-900 text-xs">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
