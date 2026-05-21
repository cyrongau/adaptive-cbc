'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Lightbulb,
  Tags,
  CheckCircle,
  Image as ImageIcon,
  Type,
  List,
  Target,
  X,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  Clock,
  BarChart,
  Save,
  Send,
  GripVertical,
  Loader2,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Curriculum', icon: BookOpen },
  { id: 2, title: 'Content', icon: FileText },
  { id: 3, title: 'Solution', icon: Lightbulb },
  { id: 4, title: 'Metadata', icon: Tags },
  { id: 5, title: 'Review', icon: CheckCircle },
];

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: List },
  { value: 'true_false', label: 'True/False', icon: Target },
  { value: 'short_answer', label: 'Short Answer', icon: Type },
  { value: 'long_answer', label: 'Long Answer', icon: FileText },
  { value: 'mathematical', label: 'Mathematical', icon: BarChart },
  { value: 'matching', label: 'Matching', icon: BookOpen },
  { value: 'fill_blank', label: 'Fill in Blank', icon: Type },
  { value: 'diagram_labeling', label: 'Diagram Labeling', icon: ImageIcon },
  { value: 'practical', label: 'Practical', icon: Target },
  { value: 'comprehension', label: 'Comprehension', icon: FileText },
  { value: 'table_interpretation', label: 'Table', icon: List },
  { value: 'graph_analysis', label: 'Graph Analysis', icon: BarChart },
];

const BLOOMS_LEVELS = [
  { value: 'remember', label: 'Remember', desc: 'Recall facts and basic concepts' },
  { value: 'understand', label: 'Understand', desc: 'Explain ideas or concepts' },
  { value: 'apply', label: 'Apply', desc: 'Use information in new situations' },
  { value: 'analyze', label: 'Analyze', desc: 'Draw connections among ideas' },
  { value: 'evaluate', label: 'Evaluate', desc: 'Justify a stand or decision' },
  { value: 'create', label: 'Create', desc: 'Produce new or original work' },
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'hard', label: 'Hard', color: 'text-red-600 bg-red-50 border-red-200' },
];

interface CurriculumTree {
  id: string;
  name: string;
  code: string;
  subjectId: string;
  applicableGrades: number[];
  sortOrder: number;
  subStrands: {
    id: string;
    name: string;
    code: string;
    strandId: string;
    applicableGrades: number[];
    sortOrder: number;
    learningOutcomes: {
      id: string;
      description: string;
      code: string;
      subStrandId: string;
      grade: number;
      sortOrder: number;
    }[];
  }[];
}

interface Subject {
  id: string;
  name: string;
  code: string;
  applicableGrades: number[];
}

interface Competency {
  id: string;
  name: string;
  code: string;
  category: string;
}

interface SolutionStep {
  step: number;
  text: string;
}

interface MatchingPair {
  left: string;
  right: string;
}

interface FormData {
  subjectId: string;
  grade: number;
  strandId: string;
  subStrandId: string;
  learningOutcomeId: string;
  type: string;
  content: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  trueFalseCorrect: boolean;
  matchingPairs: MatchingPair[];
  fillBlankText: string;
  tableData: any;
  rawData: string;
  diagramImage: File | null;
  questionMedia: { type: string; url: string; alt: string }[];
  solutionSteps: SolutionStep[];
  explanation: string;
  hints: string[];
  markingScheme: string;
  difficulty: string;
  marks: number;
  estimatedTimeSeconds: number;
  bloomsTaxonomy: string;
  competencyTags: string[];
  scope: 'PUBLIC' | 'INSTITUTION';
}

const defaultFormData: FormData = {
  subjectId: '',
  grade: 4,
  strandId: '',
  subStrandId: '',
  learningOutcomeId: '',
  type: 'multiple_choice',
  content: '',
  options: [
    { id: 'a', text: '', isCorrect: false },
    { id: 'b', text: '', isCorrect: false },
    { id: 'c', text: '', isCorrect: false },
    { id: 'd', text: '', isCorrect: false },
  ],
  correctAnswer: '',
  trueFalseCorrect: true,
  matchingPairs: [{ left: '', right: '' }],
  fillBlankText: '',
  tableData: null,
  rawData: '',
  diagramImage: null,
  questionMedia: [],
  solutionSteps: [{ step: 1, text: '' }],
  explanation: '',
  hints: [],
  markingScheme: '',
  difficulty: 'medium',
  marks: 1,
  estimatedTimeSeconds: 60,
  bloomsTaxonomy: '',
  competencyTags: [],
  scope: 'PUBLIC',
};

function CreateQuestionWizardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...defaultFormData, options: defaultFormData.options.map(o => ({ ...o })) });
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [curriculumTree, setCurriculumTree] = useState<CurriculumTree[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [filteredGrades, setFilteredGrades] = useState<number[]>([]);

  const [newHint, setNewHint] = useState('');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isOcrImport, setIsOcrImport] = useState(false);

  const selectedStrand = curriculumTree.find(s => s.id === form.strandId);
  const selectedSubStrand = selectedStrand?.subStrands.find(ss => ss.id === form.subStrandId);
  const selectedOutcomes = selectedSubStrand?.learningOutcomes.filter(lo => lo.grade === form.grade) || [];

  useEffect(() => {
    fetchSubjects();
    fetchCompetencies();
  }, []);

  useEffect(() => {
    if (form.subjectId && form.grade) {
      fetchCurriculumTree(form.subjectId, form.grade);
    } else {
      setCurriculumTree([]);
    }
  }, [form.subjectId, form.grade]);

  useEffect(() => {
    const sub = subjects.find(s => s.id === form.subjectId);
    if (sub) {
      setFilteredGrades(sub.applicableGrades || []);
    } else {
      setFilteredGrades([]);
    }
  }, [form.subjectId, subjects]);

  useEffect(() => {
    const source = searchParams?.get('source');
    const draftId = searchParams?.get('draftId');
    if (source === 'ocr' && draftId) {
      setIsOcrImport(true);
      const draft = sessionStorage.getItem(draftId);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          updateForm('content', parsed.questionText || '');
          if (parsed.options && Array.isArray(parsed.options)) {
            const newOptions = [...form.options];
            parsed.options.forEach((opt: any, idx: number) => {
              if (idx < 4) {
                newOptions[idx] = { ...newOptions[idx], text: opt.text || '' };
                if (opt.isCorrect || opt.id === parsed.correctAnswer) {
                  newOptions[idx].isCorrect = true;
                }
              }
            });
            setForm(prev => ({ ...prev, options: newOptions }));
          }
        } catch {
          console.error('Failed to parse draft');
        }
      }
    }
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
    } catch {
      toast.error('Failed to load subjects');
    }
  };

  const fetchCurriculumTree = async (subjectId: string, grade: number) => {
    try {
      const res = await api.get('/curriculum/tree', { params: { subjectId, grade } });
      setCurriculumTree(res.data || []);
    } catch {
      setCurriculumTree([]);
    }
  };

  const fetchCompetencies = async () => {
    try {
      const res = await api.get('/curriculum/competencies');
      setCompetencies(res.data || []);
    } catch {
      setCompetencies([]);
    }
  };

  const updateForm = useCallback((field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleOptionChange = (idx: number, text: string) => {
    const newOptions = [...form.options];
    newOptions[idx] = { ...newOptions[idx], text };
    setForm(prev => ({ ...prev, options: newOptions }));
  };

  const handleCorrectOption = (idx: number) => {
    const newOptions = form.options.map((o, i) => ({ ...o, isCorrect: i === idx }));
    setForm(prev => ({ ...prev, options: newOptions }));
  };

  const handleMatchingPairChange = (idx: number, side: 'left' | 'right', value: string) => {
    const newPairs = [...form.matchingPairs];
    newPairs[idx] = { ...newPairs[idx], [side]: value };
    setForm(prev => ({ ...prev, matchingPairs: newPairs }));
  };

  const addMatchingPair = () => {
    setForm(prev => ({ ...prev, matchingPairs: [...prev.matchingPairs, { left: '', right: '' }] }));
  };

  const removeMatchingPair = (idx: number) => {
    if (form.matchingPairs.length <= 1) return;
    setForm(prev => ({ ...prev, matchingPairs: prev.matchingPairs.filter((_, i) => i !== idx) }));
  };

  const addSolutionStep = () => {
    const newStep = form.solutionSteps.length + 1;
    setForm(prev => ({ ...prev, solutionSteps: [...prev.solutionSteps, { step: newStep, text: '' }] }));
  };

  const updateSolutionStep = (idx: number, text: string) => {
    const newSteps = form.solutionSteps.map((s, i) => i === idx ? { ...s, text } : s);
    setForm(prev => ({ ...prev, solutionSteps: newSteps }));
  };

  const removeSolutionStep = (idx: number) => {
    if (form.solutionSteps.length <= 1) return;
    const newSteps = form.solutionSteps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 }));
    setForm(prev => ({ ...prev, solutionSteps: newSteps }));
  };

  const addHint = () => {
    if (!newHint.trim()) return;
    setForm(prev => ({ ...prev, hints: [...prev.hints, newHint.trim()] }));
    setNewHint('');
  };

  const removeHint = (idx: number) => {
    setForm(prev => ({ ...prev, hints: prev.hints.filter((_, i) => i !== idx) }));
  };

  const toggleCompetency = (name: string) => {
    setForm(prev => ({
      ...prev,
      competencyTags: prev.competencyTags.includes(name)
        ? prev.competencyTags.filter(c => c !== name)
        : [...prev.competencyTags, name],
    }));
  };

  const nextStep = () => setCurrentStep(p => Math.min(p + 1, 5));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 1));

  const validate = (): string[] => {
    const warnings: string[] = [];
    if (!form.subjectId) warnings.push('Subject is required');
    if (!form.grade) warnings.push('Grade is required');
    if (!form.content.trim()) warnings.push('Question content is required');
    if (!form.strandId) warnings.push('CBC Strand is required');
    if (form.type === 'multiple_choice') {
      const filledOptions = form.options.filter(o => o.text.trim());
      if (filledOptions.length < 2) warnings.push('At least 2 options required');
      if (!form.options.some(o => o.isCorrect)) warnings.push('Select the correct answer');
    }
    if (!form.bloomsTaxonomy) warnings.push('Bloom\'s Taxonomy level is recommended');
    setValidationWarnings(warnings);
    return warnings;
  };

  const buildPayload = () => {
    let correctAnswer = '';
    if (form.type === 'multiple_choice') {
      correctAnswer = form.options.find(o => o.isCorrect)?.text || '';
    } else if (form.type === 'true_false') {
      correctAnswer = String(form.trueFalseCorrect);
    } else if (form.type === 'matching') {
      correctAnswer = JSON.stringify(form.matchingPairs);
    } else {
      correctAnswer = form.correctAnswer;
    }

    return {
      subjectId: form.subjectId,
      grade: form.grade,
      strandId: form.strandId || null,
      subStrandId: form.subStrandId || null,
      learningOutcomeId: form.learningOutcomeId || null,
      type: form.type,
      content: form.content,
      options: form.type === 'multiple_choice' ? form.options : undefined,
      correctAnswer,
      explanation: form.explanation || null,
      solutionSteps: form.solutionSteps.filter(s => s.text.trim()).length > 0
        ? form.solutionSteps.filter(s => s.text.trim())
        : null,
      markingScheme: form.markingScheme || null,
      hints: form.hints.length > 0 ? form.hints : null,
      difficulty: form.difficulty,
      marks: form.marks,
      estimatedTimeSeconds: form.estimatedTimeSeconds,
      bloomsTaxonomy: form.bloomsTaxonomy || null,
      competencyTags: form.competencyTags.length > 0 ? form.competencyTags : null,
      sourceType: isOcrImport ? 'ocr_imported' : 'manual',
    };
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      const payload = { ...buildPayload(), status: 'draft' };
      await api.post('/questions/structured', payload);
      toast.success('Draft saved successfully');
      router.push('/author-studio');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    const warnings = validate();
    if (warnings.length > 0) {
      toast.error('Please fix validation warnings before submitting');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...buildPayload(), status: 'pending_review' };
      await api.post('/questions/structured', payload);
      toast.success('Question submitted for review');
      router.push('/author-studio');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiEnhance = async () => {
    if (!form.content.trim()) { toast.error('Enter question text first'); return; }
    setAiLoading('enhance');
    try {
      const res = await api.post('/ai-assistant/enhance', {
        content: form.content,
        options: form.options.map(o => o.text),
      });
      const { enhanced } = res.data;
      if (enhanced) {
        updateForm('content', enhanced);
        toast.success('Question wording enhanced');
      }
    } catch {
      toast.error('AI enhancement failed');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiSolution = async () => {
    if (!form.content.trim()) { toast.error('Enter question text first'); return; }
    const correct = form.options.find(o => o.isCorrect)?.text || '';
    if (!correct) { toast.error('Mark the correct answer first'); return; }
    setAiLoading('solution');
    try {
      const res = await api.post('/ai-assistant/solution', {
        question: form.content,
        options: form.options.map(o => o.text),
        correctAnswer: correct,
      });
      const { steps, finalAnswer } = res.data;
      if (steps && Array.isArray(steps)) {
        const newSteps = steps.map((text: string, i: number) => ({ step: i + 1, text }));
        setForm(prev => ({ ...prev, solutionSteps: newSteps }));
      }
      if (finalAnswer) {
        updateForm('explanation', finalAnswer);
      }
      toast.success('Solution generated');
    } catch {
      toast.error('AI solution generation failed');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiClassify = async () => {
    if (!form.content.trim()) { toast.error('Enter question text first'); return; }
    const sub = subjects.find(s => s.id === form.subjectId);
    setAiLoading('classify');
    try {
      const res = await api.post('/ai-assistant/map-competency', {
        question: form.content,
        grade: form.grade,
        subject: sub?.name || '',
      });
      const { strand, subStrand, difficulty, bloomTaxonomy } = res.data;
      if (strand) {
        const matchedStrand = curriculumTree.find(
          s => s.name.toLowerCase().includes(strand.toLowerCase())
        );
        if (matchedStrand) updateForm('strandId', matchedStrand.id);
      }
      if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
        updateForm('difficulty', difficulty);
      }
      if (bloomTaxonomy) {
        const level = BLOOMS_LEVELS.find(
          l => bloomTaxonomy.toLowerCase().includes(l.label.toLowerCase()) ||
               l.value === bloomTaxonomy.toLowerCase()
        );
        if (level) updateForm('bloomsTaxonomy', level.value);
      }
      toast.success('AI classification complete');
    } catch {
      toast.error('AI classification failed');
    } finally {
      setAiLoading(null);
    }
  };

  const renderStepIndicator = () => (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 flex justify-between items-center relative">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 -translate-y-1/2" />
      <div
        className="absolute top-1/2 left-0 h-0.5 bg-[#47a263] -z-10 -translate-y-1/2 transition-all duration-300"
        style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
      />
      {STEPS.map((step) => {
        const isActive = currentStep === step.id;
        const isPassed = currentStep > step.id;
        return (
          <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-[#47a263] bg-[#47a263] text-white'
                  : isPassed
                  ? 'border-[#47a263] bg-white text-[#47a263]'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
              onClick={() => isPassed && setCurrentStep(step.id)}
            >
              <step.icon className="w-4 h-4" />
            </div>
            <span className={`text-xs font-medium ${isActive || isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
              {step.title}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderAISidePanel = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
        <Sparkles className="w-4 h-4 text-[#47a263]" />
        AI Assistant
      </div>
      <button
        onClick={handleAiEnhance}
        disabled={aiLoading !== null}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#47a263]/10 text-[#47a263] rounded-lg text-sm font-medium hover:bg-[#47a263]/20 transition-colors disabled:opacity-50"
      >
        {aiLoading === 'enhance' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Enhance Wording
      </button>
      <button
        onClick={handleAiSolution}
        disabled={aiLoading !== null}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
      >
        {aiLoading === 'solution' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
        Generate Solution
      </button>
      <button
        onClick={handleAiClassify}
        disabled={aiLoading !== null}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors disabled:opacity-50"
      >
        {aiLoading === 'classify' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tags className="w-4 h-4" />}
        Auto-Classify
      </button>
    </div>
  );

  const renderCurriculumStep = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Curriculum Alignment</h2>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Subject *</label>
          <select
            value={form.subjectId}
            onChange={(e) => {
              updateForm('subjectId', e.target.value);
              updateForm('strandId', '');
              updateForm('subStrandId', '');
              updateForm('learningOutcomeId', '');
            }}
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#47a263]/20 focus:border-[#47a263] outline-none bg-white"
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Grade *</label>
          <select
            value={form.grade}
            onChange={(e) => {
              updateForm('grade', Number(e.target.value));
              updateForm('strandId', '');
              updateForm('subStrandId', '');
              updateForm('learningOutcomeId', '');
            }}
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#47a263]/20 focus:border-[#47a263] outline-none bg-white"
          >
            <option value="">Select grade</option>
            {filteredGrades.map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">CBC Strand *</label>
          <select
            value={form.strandId}
            onChange={(e) => {
              updateForm('strandId', e.target.value);
              updateForm('subStrandId', '');
              updateForm('learningOutcomeId', '');
            }}
            disabled={!curriculumTree.length}
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#47a263]/20 focus:border-[#47a263] outline-none bg-white disabled:bg-slate-50"
          >
            <option value="">Select strand</option>
            {curriculumTree.map((s) => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Sub-Strand</label>
          <select
            value={form.subStrandId}
            onChange={(e) => {
              updateForm('subStrandId', e.target.value);
              updateForm('learningOutcomeId', '');
            }}
            disabled={!selectedStrand}
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#47a263]/20 focus:border-[#47a263] outline-none bg-white disabled:bg-slate-50"
          >
            <option value="">Select sub-strand</option>
            {selectedStrand?.subStrands.map((ss) => (
              <option key={ss.id} value={ss.id}>{ss.code} - {ss.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Learning Outcome</label>
        <select
          value={form.learningOutcomeId}
          onChange={(e) => updateForm('learningOutcomeId', e.target.value)}
          disabled={!selectedSubStrand}
          className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#47a263]/20 focus:border-[#47a263] outline-none bg-white disabled:bg-slate-50"
        >
          <option value="">Select learning outcome</option>
          {selectedOutcomes.map((lo) => (
            <option key={lo.id} value={lo.id}>{lo.code} - {lo.description}</option>
          ))}
        </select>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Question Type *</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {QUESTION_TYPES.map((qt) => {
            const isSelected = form.type === qt.value;
            return (
              <div
                key={qt.value}
                onClick={() => updateForm('type', qt.value)}
                className={`p-3 rounded-xl cursor-pointer flex flex-col items-center gap-2 text-center transition-all ${
                  isSelected
                    ? 'border-2 border-[#47a263] bg-[#47a263]/5'
                    : 'border border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <qt.icon className={`w-5 h-5 ${isSelected ? 'text-[#47a263]' : 'text-slate-500'}`} />
                <span className={`text-xs font-medium ${isSelected ? 'text-[#47a263]' : 'text-slate-600'}`}>
                  {qt.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  const renderContentStep = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Question Content</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700">Question Text *</label>
              <button
                onClick={handleAiEnhance}
                disabled={aiLoading !== null}
                className="text-xs flex items-center gap-1 text-[#47a263] font-medium bg-[#47a263]/10 px-2 py-1 rounded-md hover:bg-[#47a263]/20 transition-colors"
              >
                {aiLoading === 'enhance' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Enhance
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#47a263] focus-within:ring-1 focus-within:ring-[#47a263]">
              <div className="bg-slate-50 p-2 border-b border-slate-200 flex gap-2">
                <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 font-bold">B</button>
                <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 italic">I</button>
                <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 underline">U</button>
                <div className="w-px h-6 bg-slate-300 my-auto mx-1" />
                <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600 flex items-center gap-1 text-xs font-medium">
                  <ImageIcon className="w-4 h-4" /> Media
                </button>
              </div>
              <textarea
                value={form.content}
                onChange={(e) => updateForm('content', e.target.value)}
                className="w-full min-h-[120px] p-4 outline-none resize-y"
                placeholder="Type your question here. Use LaTeX with $$...$$ for mathematical expressions."
              />
            </div>
          </div>

          {form.type === 'multiple_choice' && (
            <div className="space-y-4 pt-2">
              <label className="text-sm font-medium text-slate-700">Answer Options *</label>
              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct"
                    checked={opt.isCorrect}
                    onChange={() => handleCorrectOption(idx)}
                    className="w-4 h-4 text-[#47a263] focus:ring-[#47a263] flex-shrink-0"
                  />
                  <span className="text-xs font-medium text-slate-400 w-5 flex-shrink-0">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263]"
                  />
                </div>
              ))}
              <p className="text-xs text-slate-400">Select the radio button next to the correct answer.</p>
            </div>
          )}

          {form.type === 'true_false' && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-700">Correct Answer</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300">
                  <input
                    type="radio"
                    name="tf_correct"
                    checked={form.trueFalseCorrect === true}
                    onChange={() => updateForm('trueFalseCorrect', true)}
                    className="w-4 h-4 text-[#47a263]"
                  />
                  <span className="text-sm">True</span>
                </label>
                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300">
                  <input
                    type="radio"
                    name="tf_correct"
                    checked={form.trueFalseCorrect === false}
                    onChange={() => updateForm('trueFalseCorrect', false)}
                    className="w-4 h-4 text-[#47a263]"
                  />
                  <span className="text-sm">False</span>
                </label>
              </div>
            </div>
          )}

          {form.type === 'matching' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Matching Pairs</label>
                <button
                  onClick={addMatchingPair}
                  className="text-xs flex items-center gap-1 text-[#47a263] font-medium"
                >
                  <Plus className="w-3 h-3" /> Add Pair
                </button>
              </div>
              <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                {form.matchingPairs.map((pair, idx) => (
                  <React.Fragment key={idx}>
                    <input
                      type="text"
                      value={pair.left}
                      onChange={(e) => handleMatchingPairChange(idx, 'left', e.target.value)}
                      placeholder="Left item"
                      className="p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#47a263]"
                    />
                    <span className="text-slate-400 text-sm">↔</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pair.right}
                        onChange={(e) => handleMatchingPairChange(idx, 'right', e.target.value)}
                        placeholder="Right item"
                        className="flex-1 p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#47a263]"
                      />
                      <button
                        onClick={() => removeMatchingPair(idx)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {(form.type === 'short_answer' || form.type === 'long_answer' || form.type === 'mathematical') && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-700">Correct Answer</label>
              <input
                type="text"
                value={form.correctAnswer}
                onChange={(e) => updateForm('correctAnswer', e.target.value)}
                placeholder="Enter the correct answer"
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263]"
              />
            </div>
          )}

          {form.type === 'fill_blank' && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-700">Fill-in-the-Blank Text</label>
              <p className="text-xs text-slate-400">Use <code className="bg-slate-100 px-1 rounded">[blank]</code> to mark where the blank should appear.</p>
              <textarea
                value={form.fillBlankText}
                onChange={(e) => updateForm('fillBlankText', e.target.value)}
                placeholder="The capital of Kenya is [blank]."
                className="w-full min-h-[80px] p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263] resize-y"
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Correct Answer(s)</label>
                <input
                  type="text"
                  value={form.correctAnswer}
                  onChange={(e) => updateForm('correctAnswer', e.target.value)}
                  placeholder="Nairobi"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263]"
                />
              </div>
            </div>
          )}

          {form.type === 'table_interpretation' && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-700">Table Data</label>
              <textarea
                value={form.rawData}
                onChange={(e) => updateForm('rawData', e.target.value)}
                placeholder="Enter table data as JSON array of rows, or tab-separated values"
                className="w-full min-h-[100px] p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263] resize-y font-mono text-sm"
              />
            </div>
          )}

          {form.type === 'graph_analysis' && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-700">Data for Graph</label>
              <textarea
                value={form.rawData}
                onChange={(e) => updateForm('rawData', e.target.value)}
                placeholder="Enter data points as JSON or CSV (e.g., [{x:1,y:2}, {x:2,y:4}])"
                className="w-full min-h-[100px] p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263] resize-y font-mono text-sm"
              />
            </div>
          )}

          {form.type === 'comprehension' && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-700">Passage / Reading Text</label>
              <textarea
                value={form.rawData}
                onChange={(e) => updateForm('rawData', e.target.value)}
                placeholder="Enter the reading passage here..."
                className="w-full min-h-[150px] p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263] resize-y"
              />
            </div>
          )}

          {form.type === 'diagram_labeling' && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-700">Diagram Image</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-[#47a263] transition-colors cursor-pointer">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Upload a diagram image</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, SVG up to 5MB</p>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-1">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            {renderAISidePanel()}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSolutionStep = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Solution & Explanation</h2>
        <button
          onClick={handleAiSolution}
          disabled={aiLoading !== null}
          className="text-xs flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
        >
          {aiLoading === 'solution' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Generate
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Step-by-Step Solution</label>
          <button
            onClick={addSolutionStep}
            className="text-xs flex items-center gap-1 text-[#47a263] font-medium"
          >
            <Plus className="w-3 h-3" /> Add Step
          </button>
        </div>
        {form.solutionSteps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#47a263]/10 text-[#47a263] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-2">
              {step.step}
            </div>
            <div className="flex-1">
              <textarea
                value={step.text}
                onChange={(e) => updateSolutionStep(idx, e.target.value)}
                placeholder={`Describe step ${step.step}...`}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263] resize-y min-h-[60px]"
              />
            </div>
            {form.solutionSteps.length > 1 && (
              <button
                onClick={() => removeSolutionStep(idx)}
                className="p-2 text-red-400 hover:text-red-600 transition-colors mt-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">Explanation</label>
        <textarea
          value={form.explanation}
          onChange={(e) => updateForm('explanation', e.target.value)}
          placeholder="Provide a detailed explanation of the answer..."
          className="w-full min-h-[80px] p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263] resize-y"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">Marking Scheme</label>
        <textarea
          value={form.markingScheme}
          onChange={(e) => updateForm('markingScheme', e.target.value)}
          placeholder="Describe how marks are allocated..."
          className="w-full min-h-[60px] p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263] resize-y"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Hints (Optional)</label>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newHint}
            onChange={(e) => setNewHint(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHint())}
            placeholder="Add a hint..."
            className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263]"
          />
          <button
            onClick={addHint}
            className="px-4 py-2 bg-[#47a263] text-white rounded-xl font-medium text-sm hover:bg-[#3d8c55] transition-colors"
          >
            Add
          </button>
        </div>
        {form.hints.length > 0 && (
          <div className="space-y-2">
            {form.hints.map((hint, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-sm text-amber-800 flex-1">{hint}</span>
                <button onClick={() => removeHint(idx)} className="text-amber-400 hover:text-amber-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderMetadataStep = () => (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Classification & Metadata</h2>
        <button
          onClick={handleAiClassify}
          disabled={aiLoading !== null}
          className="text-xs flex items-center gap-1 text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-md hover:bg-purple-100 transition-colors"
        >
          {aiLoading === 'classify' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Auto-Classify
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Difficulty</label>
          <div className="flex gap-2">
            {DIFFICULTY_LEVELS.map((d) => (
              <button
                key={d.value}
                onClick={() => updateForm('difficulty', d.value)}
                className={`flex-1 p-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.difficulty === d.value
                    ? d.color + ' border-2'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Marks</label>
          <input
            type="number"
            value={form.marks}
            onChange={(e) => updateForm('marks', Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Est. Time (seconds)</label>
          <input
            type="number"
            value={form.estimatedTimeSeconds}
            onChange={(e) => updateForm('estimatedTimeSeconds', Math.max(10, parseInt(e.target.value) || 60))}
            min={10}
            step={10}
            className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#47a263]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">Bloom's Taxonomy Level</label>
        <div className="grid grid-cols-3 gap-3">
          {BLOOMS_LEVELS.map((bloom) => {
            const isSelected = form.bloomsTaxonomy === bloom.value;
            return (
              <div
                key={bloom.value}
                onClick={() => updateForm('bloomsTaxonomy', bloom.value)}
                className={`p-3 rounded-xl cursor-pointer border transition-all ${
                  isSelected
                    ? 'border-[#47a263] bg-[#47a263]/5'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`text-sm font-medium ${isSelected ? 'text-[#47a263]' : 'text-slate-700'}`}>
                  {bloom.label}
                </div>
                <div className="text-xs text-slate-400 mt-1">{bloom.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">Competency Tags (CBC Core Competencies)</label>
        <div className="flex flex-wrap gap-2">
          {competencies.map((comp) => {
            const isSelected = form.competencyTags.includes(comp.name);
            return (
              <button
                key={comp.id}
                onClick={() => toggleCompetency(comp.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-[#47a263]/10 text-[#47a263] border-[#47a263]/30'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {comp.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">Content Scope</label>
        <div className="flex gap-4">
          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            form.scope === 'PUBLIC' ? 'border-[#47a263] bg-[#47a263]/5' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="scope"
              value="PUBLIC"
              checked={form.scope === 'PUBLIC'}
              onChange={() => updateForm('scope', 'PUBLIC')}
              className="w-4 h-4 text-[#47a263]"
            />
            <div>
              <div className="text-sm font-medium text-slate-700">Publicly Available</div>
              <div className="text-xs text-slate-400">Available to all platform users</div>
            </div>
          </label>
          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            form.scope === 'INSTITUTION' ? 'border-[#47a263] bg-[#47a263]/5' : 'border-slate-200 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="scope"
              value="INSTITUTION"
              checked={form.scope === 'INSTITUTION'}
              onChange={() => updateForm('scope', 'INSTITUTION')}
              className="w-4 h-4 text-[#47a263]"
            />
            <div>
              <div className="text-sm font-medium text-slate-700">Institution Scoped</div>
              <div className="text-xs text-slate-400">Private to your school</div>
            </div>
          </label>
        </div>
      </div>
    </motion.div>
  );

  const renderReviewStep = () => {
    const warnings = validate();
    return (
      <motion.div
        key="step5"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Review & Submit</h2>
        </div>

        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-medium">
              <AlertTriangle className="w-4 h-4" />
              Validation Warnings
            </div>
            <ul className="text-sm text-amber-600 space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-800">Question Preview</h3>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {form.subjectId && (
                <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                  {subjects.find(s => s.id === form.subjectId)?.name || 'Subject'}
                </span>
              )}
              {form.grade && (
                <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  Grade {form.grade}
                </span>
              )}
              <span className="text-xs font-medium px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                {QUESTION_TYPES.find(qt => qt.value === form.type)?.label || form.type}
              </span>
              {form.difficulty && (
                <span className="text-xs font-medium px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full capitalize">
                  {form.difficulty}
                </span>
              )}
              {form.bloomsTaxonomy && (
                <span className="text-xs font-medium px-2 py-0.5 bg-green-50 text-green-600 rounded-full capitalize">
                  {form.bloomsTaxonomy}
                </span>
              )}
            </div>

            <div className="prose max-w-none text-slate-800 text-sm">
              <p>{form.content || <span className="text-slate-300 italic">No question content entered yet</span>}</p>
            </div>

            {form.type === 'multiple_choice' && form.options.some(o => o.text) && (
              <div className="mt-4 space-y-2">
                {form.options.filter(o => o.text).map((opt, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      opt.isCorrect ? 'border-[#47a263] bg-[#47a263]/5' : 'border-slate-200'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      opt.isCorrect ? 'bg-[#47a263] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm">{opt.text}</span>
                    {opt.isCorrect && <CheckCircle className="w-4 h-4 text-[#47a263] ml-auto" />}
                  </div>
                ))}
              </div>
            )}

            {form.type === 'true_false' && (
              <div className="mt-4 p-3 rounded-xl border border-slate-200">
                <span className="text-sm font-medium">
                  Correct Answer: <span className={form.trueFalseCorrect ? 'text-[#47a263]' : 'text-red-500'}>{String(form.trueFalseCorrect)}</span>
                </span>
              </div>
            )}

            {form.correctAnswer && form.type !== 'multiple_choice' && form.type !== 'true_false' && (
              <div className="mt-4 p-3 rounded-xl border border-slate-200 bg-green-50">
                <span className="text-sm font-medium text-green-700">Answer: {form.correctAnswer}</span>
              </div>
            )}
          </div>

          {form.solutionSteps.some(s => s.text.trim()) && (
            <div>
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Solution</h4>
              <div className="space-y-2">
                {form.solutionSteps.filter(s => s.text.trim()).map((step, idx) => (
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

          {form.explanation && (
            <div>
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Explanation</h4>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">{form.explanation}</p>
            </div>
          )}

          {form.marks && (
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><BarChart className="w-4 h-4" /> {form.marks} mark{form.marks > 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {form.estimatedTimeSeconds}s</span>
              <span className="flex items-center gap-1">{form.scope === 'PUBLIC' ? '🌍 Public' : '🏫 Institution'}</span>
            </div>
          )}

          {form.competencyTags.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Competencies</h4>
              <div className="flex flex-wrap gap-1.5">
                {form.competencyTags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-[#47a263]/10 text-[#47a263] rounded-lg text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/author-studio" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Create New Question</h1>
          <p className="text-slate-500 text-sm">Author structured content for the CBC question bank</p>
        </div>
      </div>

      {renderStepIndicator()}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-8 flex-1">
          <AnimatePresence mode="wait">
            {currentStep === 1 && renderCurriculumStep()}
            {currentStep === 2 && renderContentStep()}
            {currentStep === 3 && renderSolutionStep()}
            {currentStep === 4 && renderMetadataStep()}
            {currentStep === 5 && renderReviewStep()}
          </AnimatePresence>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl font-medium disabled:opacity-50 transition-colors hover:bg-slate-100"
          >
            Back
          </button>

          <div className="flex gap-3">
            {currentStep < 5 ? (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl font-medium text-sm transition-colors hover:bg-slate-100 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Draft
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-[#47a263] text-white rounded-xl font-medium flex items-center gap-2 hover:bg-[#3d8c55] transition-colors"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl font-medium text-sm transition-colors hover:bg-slate-100 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Draft
                </button>
                <button
                  onClick={handleSubmitForReview}
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit for Review
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateQuestionWizard() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading editor...</div>}>
      <CreateQuestionWizardContent />
    </Suspense>
  );
}
