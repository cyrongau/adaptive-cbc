'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, FileText, Download, Eye, Share2, Clock, BookOpen,
  User, ChevronRight, Star, Globe, Lock, DollarSign, Image, Video,
  File, Maximize2, ExternalLink, Loader2,
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  pdf: { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
  doc: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  image: { icon: Image, color: 'text-purple-500', bg: 'bg-purple-50' },
  video: { icon: Video, color: 'text-amber-500', bg: 'bg-amber-50' },
  link: { icon: Globe, color: 'text-cyan-500', bg: 'bg-cyan-50' },
};

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subjectName, setSubjectName] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemRes, subjectsRes] = await Promise.allSettled([
          api.get(`/materials/${params.id}`),
          api.get('/subjects'),
        ]);

        if (itemRes.status === 'fulfilled') {
          const data = itemRes.value.data;
          setItem(data);
          if (subjectsRes.status === 'fulfilled') {
            const subjects = subjectsRes.value.data;
            const subject = subjects.find((s: any) => s.id === data.subjectId);
            setSubjectName(subject?.name || '');
          }
        } else {
          toast.error('Material not found');
          router.push('/materials');
        }
      } catch {
        toast.error('Failed to load material');
        router.push('/materials');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleDownload = async () => {
    if (!item) return;
    setDownloading(true);
    try {
      const res = await api.post(`/materials/${params.id}/download`);
      const url = res.data?.fileUrl;
      if (url) {
        window.open(url, '_blank');
        toast.success('Download started');
      } else {
        toast.error('No file available for download');
      }
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: item?.title || 'School Material',
      text: `Check out this material: ${item?.title}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const openPreview = () => {
    if (item?.fileUrl) window.open(item.fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!item) return null;

  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.pdf;
  const isImage = item.fileUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
  const isPdf = item.fileUrl?.endsWith('.pdf');
  const formatSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / 1024 / 1024;
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/materials" className="hover:text-[#47a263] transition-colors font-medium">Materials</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-700 font-semibold truncate">{item.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl ${typeConfig.bg} flex items-center justify-center shrink-0`}>
                <typeConfig.icon className={`w-7 h-7 ${typeConfig.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-2.5 py-0.5 ${typeConfig.bg} ${typeConfig.color} text-xs font-bold rounded-full uppercase`}>{item.type}</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{item.category}</span>
                  {subjectName && <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">{subjectName}</span>}
                  {item.grade && <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full">Grade {item.grade}</span>}
                  {item.visibility === 'public' ? (
                    <span className="px-2.5 py-0.5 bg-green-50 text-green-600 text-xs font-bold rounded-full flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full flex items-center gap-1"><Lock className="w-3 h-3" /> Institution Only</span>
                  )}
                  {item.isPremium && (
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full flex items-center gap-1"><DollarSign className="w-3 h-3" /> KSh {item.price}</span>
                  )}
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 mt-2">{item.title}</h1>
                {item.createdByUser && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <User className="w-4 h-4" />
                    <span>Uploaded by <strong className="text-slate-700">{item.createdByUser.firstName} {item.createdByUser.lastName}</strong></span>
                    <span className="text-slate-300">|</span>
                    <Clock className="w-4 h-4" />
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
                { icon: FileText, label: 'File Size', value: formatSize(item.fileSize) },
                { icon: Eye, label: 'Views', value: item.viewCount?.toLocaleString() || '0' },
                { icon: Download, label: 'Downloads', value: item.downloadCount?.toLocaleString() || '0' },
                { icon: Clock, label: 'Updated', value: new Date(item.updatedAt).toLocaleDateString() },
              ].map((meta, i) => (
                <div key={i} className="text-center">
                  <meta.icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 font-medium uppercase">{meta.label}</p>
                  <p className="text-sm font-bold text-slate-900">{meta.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

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
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
            <div className="text-center mb-6">
              <div className="w-full aspect-[3/4] bg-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative border border-slate-200 group">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt="Preview" className="w-full h-full object-cover cursor-pointer" onClick={openPreview} />
                ) : isImage ? (
                  <img src={item.fileUrl} alt="Preview" className="w-full h-full object-cover cursor-pointer" onClick={openPreview} />
                ) : isPdf ? (
                  <iframe src={`${item.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full border-0" title="PDF Preview" />
                ) : (
                  <typeConfig.icon className={`w-16 h-16 ${typeConfig.color}`} />
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
            </div>

            <div className="space-y-3">
              <button onClick={handleDownload} disabled={downloading}
                className="w-full py-3 bg-[#47a263] text-white font-extrabold text-sm rounded-xl hover:bg-[#3d8b55] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? 'Downloading...' : 'Download'}
              </button>
              <button onClick={handleShare} className="w-full py-3 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
