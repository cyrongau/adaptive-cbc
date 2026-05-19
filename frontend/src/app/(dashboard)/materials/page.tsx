'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  FolderOpen, 
  Plus, 
  FileText, 
  Image, 
  Video, 
  File,
  Share2,
  Users,
  Download,
  Eye,
  MoreVertical,
  X,
  Search,
  Filter,
  Globe,
  Lock,
  DollarSign,
  Upload
} from 'lucide-react';

interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'image' | 'video' | 'link';
  category: string;
  subject?: string;
  grade?: number;
  size: string;
  views: number;
  downloads: number;
  sharedBy: string;
  sharedWith: string[];
  createdAt: string;
}

const MOCK_MATERIALS: Material[] = [
  { id: '1', title: 'Grade 5 Mathematics Worksheet Set', type: 'pdf', category: 'Worksheets', subject: 'Mathematics', grade: 5, size: '2.4 MB', views: 156, downloads: 89, sharedBy: 'Mr. John', sharedWith: ['Grade 5 Students'], createdAt: '2024-03-15' },
  { id: '2', title: 'Science Lab Experiment Videos', type: 'video', category: 'Videos', subject: 'Science', grade: 7, size: '156 MB', views: 234, downloads: 67, sharedBy: 'Ms. Sarah', sharedWith: ['Grade 7 Students'], createdAt: '2024-03-12' },
  { id: '3', title: 'English Grammar Notes', type: 'doc', category: 'Notes', subject: 'English', grade: 4, size: '450 KB', views: 89, downloads: 45, sharedBy: 'Mr. David', sharedWith: ['Grade 4 Students'], createdAt: '2024-03-10' },
  { id: '4', title: 'Geography Map Collection', type: 'image', category: 'Images', subject: 'Social Studies', grade: 6, size: '12 MB', views: 178, downloads: 92, sharedBy: 'Mrs. Mary', sharedWith: ['Grade 6 Students'], createdAt: '2024-03-08' },
  { id: '5', title: 'Kiswahili Vitendawili Collection', type: 'pdf', category: 'Activities', subject: 'Kiswahili', grade: 5, size: '1.2 MB', views: 145, downloads: 78, sharedBy: 'Mr. Peter', sharedWith: ['Grade 5 Students'], createdAt: '2024-03-05' },
];

const CATEGORIES = ['All', 'Worksheets', 'Notes', 'Videos', 'Images', 'Activities', 'Schemes', 'Lesson Plans'];
const SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies', 'Kiswahili', 'Creative Arts'];

export default function MaterialsPage() {
  const { user } = useAuthStore();
  const [materials] = useState<Material[]>(MOCK_MATERIALS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSubject, setFilterSubject] = useState('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [shareForm, setShareForm] = useState({ recipients: '', message: '' });

  const isTeacher = user?.role === 'teacher' || user?.role === 'super_admin' || user?.role === 'institution_admin';
  const isContentCreator = user?.role === 'teacher' || user?.role === 'tutor';

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'pdf',
    category: 'Notes',
    subject: 'Mathematics',
    grade: 5,
    description: '',
    visibility: 'public',
    isPremium: false,
    price: 0,
  });

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || m.category === filterCategory;
    const matchesSubject = filterSubject === 'all' || m.subject === filterSubject;
    return matchesSearch && matchesCategory && matchesSubject;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'doc': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'image': return <Image className="w-5 h-5 text-green-500" />;
      case 'video': return <Video className="w-5 h-5 text-purple-500" />;
      default: return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleShare = (material: Material) => {
    setSelectedMaterial(material);
    setShowShareModal(true);
  };

  const handleSubmitShare = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Materials shared with ${shareForm.recipients}!`);
    setShowShareModal(false);
    setShareForm({ recipients: '', message: '' });
    setSelectedMaterial(null);
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const pricing = uploadForm.isPremium ? `KES ${uploadForm.price}` : 'Free';
    const access = uploadForm.visibility === 'public' ? 'Public' : 'Institution Only';
    toast.success(`"${uploadForm.title}" uploaded — ${access}, ${pricing}`);
    setShowUploadModal(false);
    setUploadForm({ title: '', type: 'pdf', category: 'Notes', subject: 'Mathematics', grade: 5, description: '', visibility: 'public', isPremium: false, price: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Materials</h1>
          <p className="text-slate-500 mt-1">Share learning materials with students and colleagues</p>
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Upload Material
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Materials', value: materials.length, icon: FolderOpen, color: 'bg-blue-50 text-blue-600' },
          { label: 'PDF/Docs', value: materials.filter(m => m.type === 'pdf' || m.type === 'doc').length, icon: FileText, color: 'bg-red-50 text-red-600' },
          { label: 'Videos', value: materials.filter(m => m.type === 'video').length, icon: Video, color: 'bg-purple-50 text-purple-600' },
          { label: 'Total Downloads', value: materials.reduce((sum, m) => sum + m.downloads, 0), icon: Download, color: 'bg-green-50 text-green-600' },
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
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">All Subjects</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No materials found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material, i) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  {getTypeIcon(material.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 line-clamp-2">{material.title}</h3>
                  <p className="text-sm text-slate-500">{material.category}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                {material.subject && <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-lg">{material.subject}</span>}
                {material.grade && <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">Grade {material.grade}</span>}
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">{material.size}</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {material.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {material.downloads}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    <Download className="w-4 h-4" />
                  </button>
                  {isTeacher && (
                    <button 
                      onClick={() => handleShare(material)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Share Material</h2>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="font-medium text-slate-900">{selectedMaterial.title}</p>
              <p className="text-sm text-slate-500">{selectedMaterial.category} • {selectedMaterial.size}</p>
            </div>
            <form onSubmit={handleSubmitShare} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Share With</label>
                <select
                  value={shareForm.recipients}
                  onChange={(e) => setShareForm({ ...shareForm, recipients: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  required
                >
                  <option value="">Select recipients...</option>
                  <option value="Grade 4">Grade 4 Students</option>
                  <option value="Grade 5">Grade 5 Students</option>
                  <option value="Grade 6">Grade 6 Students</option>
                  <option value="All Teachers">All Teachers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message (Optional)</label>
                <textarea
                  value={shareForm.message}
                  onChange={(e) => setShareForm({ ...shareForm, message: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  rows={3}
                  placeholder="Add a note for recipients..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                >
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Upload Material</h2>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUploadMaterial} className="space-y-4">
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select
                      value={uploadForm.type}
                      onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    >
                      <option value="pdf">PDF</option>
                      <option value="doc">Document</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="link">Link</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <select
                      value={uploadForm.subject}
                      onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                    <select
                      value={uploadForm.grade}
                      onChange={(e) => setUploadForm({ ...uploadForm, grade: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    rows={2}
                  />
                </div>

                {/* Visibility & Pricing - teacher/tutor only */}
                {isContentCreator ? (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <p className="text-sm font-semibold text-slate-700">Access & Distribution</p>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-2">Who can access this material?</label>
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
                          Public
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
                    </div>

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
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, Images, Video up to 50MB</p>
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}