'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, FileText, Download, Eye, Share2, Clock, BookOpen,
  Calendar, User, Tag, ChevronRight, ExternalLink, Star,
} from 'lucide-react';

const MOCK_DOCUMENT = {
  id: '1',
  title: 'Grade 5 Mathematics Past Paper - Term 1 2024',
  type: 'Past Paper',
  subject: 'Mathematics',
  grade: 5,
  term: 'Term 1',
  year: '2024',
  description: 'Complete Grade 5 Mathematics past paper covering all Term 1 topics including numbers, operations, measurement, geometry, and data handling. Compiled by the Kenya National Examination Council (KNEC) style guidelines.',
  fileSize: '3.2 MB',
  pages: 12,
  views: 1245,
  downloads: 876,
  uploadedBy: 'Mr. James Omondi',
  uploadedAt: '2024-03-15',
  lastUpdated: '2024-03-15',
  rating: 4.8,
  reviewCount: 234,
  previewUrl: '#',
  downloadUrl: '#',
  tags: ['Past Paper', 'Mathematics', 'Grade 5', 'Term 1', 'KPSEA Preparation'],
  relatedDocuments: [
    { id: '2', title: 'Grade 5 English Composition Guide', type: 'Notes', subject: 'English' },
    { id: '3', title: 'Grade 5 Science Revision Kit', type: 'Revision Kit', subject: 'Science' },
    { id: '4', title: 'Grade 5 Kiswahili Sarufi Notes', type: 'Notes', subject: 'Kiswahili' },
  ],
};

export default function LibraryItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(MOCK_DOCUMENT);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In production, fetch from: /api/digital-library/:id
    // setLoading(true); const res = await api.get(`/digital-library/${params.id}`); setItem(res.data);
  }, [params.id]);

  const handleDownload = () => {
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
        <Link href="/library" className="hover:text-[#47a263] transition-colors font-medium">Digital Library</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-700 font-semibold truncate">{item.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-[#47a263]/10 flex items-center justify-center shrink-0">
                <FileText className="w-7 h-7 text-[#47a263]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-[#47a263]/10 text-[#47a263] text-xs font-bold rounded-full">{item.type}</span>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">{item.subject}</span>
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full">Grade {item.grade}</span>
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 mt-2">{item.title}</h1>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">{item.description}</p>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
              {[
                { icon: FileText, label: 'File Size', value: item.fileSize },
                { icon: Clock, label: 'Pages', value: `${item.pages} pages` },
                { icon: Calendar, label: 'Term', value: item.term },
                { icon: BookOpen, label: 'Year', value: item.year },
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

          {/* Related Documents */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Related Documents</h2>
            <div className="space-y-3">
              {item.relatedDocuments.map((doc: any) => (
                <Link key={doc.id} href={`/library/${doc.id}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#47a263]/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#47a263]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{doc.title}</p>
                    <p className="text-xs text-slate-400">{doc.subject} • {doc.type}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
            <div className="text-center mb-6">
              <div className="w-full aspect-[3/4] bg-slate-100 rounded-xl mb-4 flex items-center justify-center">
                <FileText className="w-16 h-16 text-slate-300" />
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                ))}
                <span className="text-xs text-slate-400 ml-1">({item.reviewCount})</span>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={handleDownload} className="w-full py-3 bg-[#47a263] text-white font-extrabold text-sm rounded-xl hover:bg-[#3d8b55] transition-all shadow-sm flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={handleShare} className="w-full py-3 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            <div className="space-y-3 mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Eye className="w-4 h-4" /> Views</span>
                <span className="font-semibold text-slate-900">{item.views.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Download className="w-4 h-4" /> Downloads</span>
                <span className="font-semibold text-slate-900">{item.downloads.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><User className="w-4 h-4" /> Uploaded by</span>
                <span className="font-semibold text-slate-900 text-xs">{item.uploadedBy}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Uploaded</span>
                <span className="font-semibold text-slate-900 text-xs">{item.uploadedAt}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
