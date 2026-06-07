'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Upload,
  Image,
  Download,
  Wand2,
  FileType,
  Tags,
  Loader2,
  ChevronRight,
  Grid3X3,
  Eye,
  Check,
  X,
  BookOpen,
  Beaker,
  Atom,
  Globe,
  Calculator,
  Zap,
  Layers,
  Save,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

type ProcessingMode = 'enhance' | 'vectorize' | 'label';

interface Template {
  label: string;
  description: string;
}

interface TemplatesBySubject {
  [subject: string]: Template[];
}

interface Label {
  x: number;
  y: number;
  text: string;
  confidence: number;
}

interface EnhancedResult {
  id: string;
  originalUrl: string;
  enhancedUrl: string;
  format: string;
  width: number;
  height: number;
}

interface VectorizedResult {
  id: string;
  originalUrl: string;
  svgUrl: string;
  svgContent: string;
}

interface LabeledResult {
  id: string;
  imageUrl: string;
  labels: Label[];
}

export default function DiagramStudioPage() {
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<TemplatesBySubject>({});
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<ProcessingMode>('enhance');
  const [instructions, setInstructions] = useState('');
  const [result, setResult] = useState<EnhancedResult | VectorizedResult | LabeledResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'templates'>('upload');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/diagrams/templates');
      setTemplates(res.data);
    } catch {
      setTemplates({
        biology: [
          { label: 'Cell Structure', description: 'Plant/animal cell with organelles' },
          { label: 'Human Heart', description: 'Labeled heart chambers and vessels' },
        ],
        physics: [
          { label: 'Circuit Diagram', description: 'Series/parallel electrical circuits' },
          { label: 'Force Diagram', description: 'Free body diagrams with vectors' },
        ],
        mathematics: [
          { label: 'Geometry Shapes', description: 'Triangles, quadrilaterals, circles' },
          { label: 'Coordinate Plane', description: 'Cartesian grid with points' },
        ],
      });
    }
  };

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const processDiagram = async () => {
    if (!file) { toast.error('Upload a diagram first'); return; }
    setProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (mode === 'enhance' && instructions) formData.append('instructions', instructions);
      if (mode === 'label' && selectedSubject) formData.append('subject', selectedSubject);

      const endpoint = mode === 'enhance' ? '/diagrams/enhance'
        : mode === 'vectorize' ? '/diagrams/vectorize'
        : '/diagrams/label';

      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(res.data);
      toast.success('Diagram processed successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleTemplateSelect = async (subject: string, template: Template) => {
    setSelectedSubject(subject);
    setSelectedTemplate(template);
    setActiveTab('upload');
    toast.success(`Selected template: ${template.label}`);
  };

  const subjectIcons: Record<string, React.ReactNode> = {
    biology: <BookOpen className="w-4 h-4" />,
    physics: <Zap className="w-4 h-4" />,
    mathematics: <Calculator className="w-4 h-4" />,
    chemistry: <Beaker className="w-4 h-4" />,
    geography: <Globe className="w-4 h-4" />,
  };

  const subjectLabels: Record<string, string> = {
    biology: 'Biology',
    physics: 'Physics',
    mathematics: 'Mathematics',
    chemistry: 'Chemistry',
    geography: 'Geography',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/author-studio" className="hover:text-blue-500">Author Studio</Link>
              <ChevronRight className="w-3 h-3" />
              <span>Diagram Studio</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diagram & Illustration Studio</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload sketches, enhance with AI, vectorize, and add labels for CBC questions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                      activeTab === 'upload'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Diagram
                  </button>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                      activeTab === 'templates'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Layers className="w-4 h-4 inline mr-2" />
                    Templates
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'templates' ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subject Templates</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Select a subject and template to get started with a pre-defined diagram structure
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.keys(templates).map((subject) => (
                        <button
                          key={subject}
                          onClick={() => setSelectedSubject(subject === selectedSubject ? '' : subject)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            selectedSubject === subject
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {subjectIcons[subject]}
                          {subjectLabels[subject] || subject}
                        </button>
                      ))}
                    </div>

                    {selectedSubject && templates[selectedSubject] && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {templates[selectedSubject].map((template) => (
                          <button
                            key={template.label}
                            onClick={() => handleTemplateSelect(selectedSubject, template)}
                            className={`text-left p-4 rounded-lg border transition-all ${
                              selectedTemplate?.label === template.label
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
                                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">{template.label}</span>
                              {selectedTemplate?.label === template.label && (
                                <Check className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{template.description}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {!selectedSubject && (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                        <Grid3X3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Select a subject to view available templates</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {!previewUrl ? (
                      <div
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                          dragOver
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                        onClick={() => document.getElementById('diagram-upload')?.click()}
                      >
                        <Image className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                          Drop your diagram here, or click to browse
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Supports PNG, JPG, WEBP up to 10MB
                        </p>
                        <input
                          id="diagram-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(f);
                          }}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="relative mb-4">
                          <img
                            src={previewUrl}
                            alt="Uploaded diagram"
                            className="max-h-96 mx-auto rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <button
                            onClick={() => { setFile(null); setPreviewUrl(null); setResult(null); }}
                            className="absolute top-2 right-2 p-1.5 bg-gray-900/60 hover:bg-gray-900/80 text-white rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 text-center">
                          {file?.name} ({(file?.size ?? 0) / 1024 / 1024 < 1
                            ? `${((file?.size ?? 0) / 1024).toFixed(0)} KB`
                            : `${((file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {previewUrl && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Processing Options</h3>

                <div className="flex gap-2 mb-4">
                  {([
                    { key: 'enhance', icon: Wand2, label: 'Enhance' },
                    { key: 'vectorize', icon: FileType, label: 'Vectorize to SVG' },
                    { key: 'label', icon: Tags, label: 'Auto-Label' },
                  ] as const).map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      onClick={() => setMode(key)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        mode === key
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-blue-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {mode === 'enhance' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Enhancement Instructions (optional)
                    </label>
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g., Increase contrast, remove background noise, add color..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      rows={2}
                    />
                  </div>
                )}

                {mode === 'label' && !selectedSubject && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                    Tip: Select a subject from the Templates tab for more accurate labeling
                  </p>
                )}

                <button
                  onClick={processDiagram}
                  disabled={processing}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {processing ? 'Processing...' : `Apply ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                Preview
              </h3>

              {result ? (
                <div>
                  {'enhancedUrl' in result ? (
                    <img
                      src={result.enhancedUrl}
                      alt="Enhanced diagram"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  ) : 'svgContent' in result ? (
                    <div
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white overflow-auto"
                      dangerouslySetInnerHTML={{ __html: result.svgContent }}
                    />
                  ) : 'labels' in result && result.labels.length > 0 ? (
                    <div className="relative">
                      <img
                        src={result.imageUrl}
                        alt="Labeled diagram"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        {result.labels.map((label, i) => (
                          <g key={i}>
                            <circle
                              cx={`${(label.x / 800) * 100}%`}
                              cy={`${(label.y / 600) * 100}%`}
                              r="4"
                              fill="#3b82f6"
                              stroke="white"
                              strokeWidth="1.5"
                            />
                            <text
                              x={`${(label.x / 800) * 100}%`}
                              y={`${(label.y / 600) * 100 - 8}%`}
                              fill="#3b82f6"
                              fontSize="4"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {label.text}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No labels found</p>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => toast.success('Saved to media library')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save to Library
                    </button>
                    <button
                      onClick={() => window.location.href = '/author-studio/create'}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Use in Question
                    </button>
                  </div>
                </div>
              ) : file ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Select a processing mode and click apply to see results
                </p>
              ) : (
                <div className="text-center py-8">
                  <Image className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-400">Upload a diagram to preview</p>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Tips</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  Use clear, well-lit photos for best results
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  Vectorize converts sketches to scalable SVG
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  Auto-label works best with subject-specific templates
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  Enhanced diagrams can be saved to your media library
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
