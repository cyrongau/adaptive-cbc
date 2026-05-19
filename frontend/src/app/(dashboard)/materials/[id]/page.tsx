'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, FileText, Download, Eye, Share2, Clock, BookOpen,
  User, ChevronRight, Star, Globe, Lock, DollarSign, Image, Video,
} from 'lucide-react';

const MOCK_MATERIAL = {
  id: '1',
  title: 'Grade 5 Mathematics Worksheet Set',
  type: 'pdf',
  category: 'Worksheets',
  subject: 'Mathematics',
  grade: 5,
  size: '2.4 MB',
  description: 'A comprehensive set of 20 mathematics worksheets covering multiplication, division, fractions, and geometry for Grade 5 students. Aligned with CBC curriculum requirements.',
  views: 156,
  downloads: 89,
  sharedBy: 'Mr. John Kamau',
  sharedWith: ['Grade 5 Students'],
  createdAt: '2024-03-15',
  updatedAt: '2024-03-15',
  visibility: 'public',
  price: 0,
  pages: 24,
  rating: 4.6,
  previewUrl: '#',
  downloadUrl: '#',
  tags: ['Worksheets', 'Mathematics', 'Grade 5', 'CBC', 'Practice'],
  relatedMaterials: [
    { id: '2', title: 'Grade 5 Science Notes - Plant Biology', type: 'doc', subject: 'Science' },
    { id: '3', title: 'Grade 5 English Grammar Exercises', type: 'pdf', subject: 'English' },
    { id: '4', title: 'Grade 5 Creative Arts Projects', type: 'image', subject: 'Creative Arts' },
  ],
};

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  pdf: { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
  doc: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  image: { icon: Image, color: 'text-purple-500', bg: 'bg-purple-50' },
  video: { icon: Video, color: 'text-amber-500', bg: 'bg-amber-50' },
  link: { icon: Globe, color: 'text-cyan-500', bg: 'bg-cyan-50' },
};

export default function MaterialDetailPage() {
  const params = useParams();
  const [item, setItem] = useState<any>(MOCK_MATERIAL);

  useEffect(() => {
    // In production: const res = await api.get(`/materials/${params.id}`); setItem(res.data);
  }, [params.id]);

  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.pdf;

  const handleDownload = () => {
    if (item.price > 0) {
      toast.error('Please purchase this material to download');
      return;
    }
    toast.success('Download started');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/materials" className="hover:text-[#47a263] transition-colors font-medium">Materials</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-700 font-semibold truncate">{item.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
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
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">{item.subject}</span>
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full">Grade {item.grade}</span>
                  {item.visibility === 'public' ? (
                    <span className="px-2.5 py-0.5 bg-green-50 text-green-600 text-xs font-bold rounded-full flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full flex items-center gap-1"><Lock className="w-3 h-3" /> Institution Only</span>
                  )}
                  {item.price > 0 && (
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full flex items-center gap-1"><DollarSign className="w-3 h-3" /> KSh {item.price}</span>
                  )}
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 mt-2">{item.title}</h1>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">{item.description}</p>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
              {[
                { icon: FileText, label: 'File Size', value: item.size },
                { icon: BookOpen, label: 'Pages', value: `${item.pages} pages` },
                { icon: Eye, label: 'Views', value: item.views.toLocaleString() },
                { icon: Download, label: 'Downloads', value: item.downloads.toLocaleString() },
              ].map((meta, i) => (
                <div key={i} className="text-center">
                  <meta.icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 font-medium uppercase">{meta.label}</p>
                  <p className="text-sm font-bold text-slate-900">{meta.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tags */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">{tag}</span>
              ))}
            </div>
          </motion.div>

          {/* Related Materials */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Related Materials</h2>
            <div className="space-y-3">
              {item.relatedMaterials.map((mat: any) => {
                const t = TYPE_CONFIG[mat.type] || TYPE_CONFIG.pdf;
                return (
                  <Link key={mat.id} href={`/materials/${mat.id}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className={`w-8 h-8 rounded-lg ${t.bg} flex items-center justify-center shrink-0`}>
                      <t.icon className={`w-4 h-4 ${t.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{mat.title}</p>
                      <p className="text-xs text-slate-400">{mat.subject} • {mat.type.toUpperCase()}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
            <div className="text-center mb-6">
              <div className="w-full aspect-[3/4] bg-slate-100 rounded-xl mb-4 flex items-center justify-center">
                <typeConfig.icon className={`w-16 h-16 ${typeConfig.color}`} />
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                ))}
                <span className="text-xs text-slate-400 ml-1">(4.6)</span>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={handleDownload} className="w-full py-3 bg-[#47a263] text-white font-extrabold text-sm rounded-xl hover:bg-[#3d8b55] transition-all shadow-sm flex items-center justify-center gap-2">
                {item.price > 0 ? (
                  <><DollarSign className="w-4 h-4" /> Purchase KSh {item.price}</>
                ) : (
                  <><Download className="w-4 h-4" /> Download Free</>
                )}
              </button>
              <button onClick={handleShare} className="w-full py-3 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            <div className="space-y-3 mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><User className="w-4 h-4" /> Shared by</span>
                <span className="font-semibold text-slate-900 text-xs">{item.sharedBy}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Updated</span>
                <span className="font-semibold text-slate-900 text-xs">{item.updatedAt}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Globe className="w-4 h-4" /> Visibility</span>
                <span className="font-semibold text-slate-900 text-xs capitalize">{item.visibility}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
