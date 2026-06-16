'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FileText, Plus, Clock, Users, CheckCircle, XCircle, ArrowRight, Edit2, Trash2, BookOpen, Star, Send, Sparkles } from 'lucide-react';
import HtmlContent from '@/components/ui/HtmlContent';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  strand: string;
  subStrand: string;
  grade: number;
  totalPoints: number;
  dueDate: string;
  status: string;
  questionCount: number;
  submittedCount: number;
  gradedCount: number;
  createdAt: string;
}

interface CurriculumStrand {
  id: string;
  name: string;
  subStrands: { id: string; name: string }[];
}

interface Submission {
  id: string;
  assignmentId: string;
  status: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const RichTextEditor = ({ value, onChange, placeholder = 'Write something...', minHeight = 200 }: RichTextEditorProps) => {
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !ReactQuill) {
      const timer = setTimeout(() => {
        if (!ReactQuill) setLoadError(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  if (!mounted) {
    return <div className="border border-slate-200 rounded-xl p-4 text-slate-400" style={{ minHeight }}>Loading editor...</div>;
  }

  if (loadError) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-slate-200 rounded-xl"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ script: 'sub' }, { script: 'super' }],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],
            ['link', 'image', 'formula'],
            ['clean'],
          ],
        }}
        formats={['header', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'script', 'blockquote', 'code-block', 'list', 'bullet', 'indent', 'link', 'image', 'formula']}
      />
      <style jsx global>{`
        .rich-text-editor .ql-editor { min-height: ${minHeight}px; }
      `}</style>
    </div>
  );
};

export default function AssignmentsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: 'Mathematics',
    topic: '',
    strand: '',
    subStrand: '',
    grade: 4,
    dueDate: '',
    totalPoints: 10,
    questionCount: 5,
  });

  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [curriculumTree, setCurriculumTree] = useState<CurriculumStrand[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (isStudent) {
      fetchStudentAssignments();
    } else if (isTeacher) {
      fetchTeacherAssignments();
      fetchSubjects();
    } else {
      setLoading(false);
    }
  }, [isStudent, isTeacher]);

  useEffect(() => {
    if (!isTeacher || !formData.subject || !formData.grade) {
      setCurriculumTree([]);
      return;
    }
    const subject = subjects.find((s) => s.name === formData.subject);
    if (!subject) {
      setCurriculumTree([]);
      return;
    }
    setCurriculumLoading(true);
    api.get('/curriculum/tree', { params: { subjectId: subject.id, grade: formData.grade } })
      .then((res) => {
        const strands: CurriculumStrand[] = res.data || [];
        setCurriculumTree(strands);
        if (strands.length > 0 && formData.strand && !strands.some((s) => s.name === formData.strand)) {
          setFormData((prev) => ({ ...prev, strand: '', subStrand: '' }));
        }
      })
      .catch(() => setCurriculumTree([]))
      .finally(() => setCurriculumLoading(false));
  }, [isTeacher, formData.subject, formData.grade, subjects]);

  const fetchStudentAssignments = async () => {
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        api.get('/assignments/student'),
        api.get('/assignments/submissions/my'),
      ]);
      setAssignments(assignmentsRes.data);
      setSubmissions(submissionsRes.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherAssignments = async () => {
    try {
      const response = await api.get('/assignments/my-assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data || []);
    } catch {
      console.error('Failed to load subjects');
    }
  };

  const getSubmissionForAssignment = (assignmentId: string): Submission | undefined => {
    return submissions.find((s) => s.assignmentId === assignmentId);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assignments', {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        topic: formData.subStrand || formData.strand || formData.topic,
        strand: formData.strand,
        subStrand: formData.subStrand,
        grade: formData.grade,
        totalPoints: formData.totalPoints,
        dueDate: new Date(formData.dueDate),
        questionCount: generatedQuestions.length > 0 ? generatedQuestions.length : formData.questionCount,
        questionIds: generatedQuestions.length > 0 ? generatedQuestions.map((q) => q.id) : undefined,
      });
      toast.success('Assignment created successfully!');
      setShowModal(false);
      resetForm();
      fetchTeacherAssignments();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to create assignment';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    try {
      const updatePayload: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        totalPoints: formData.totalPoints,
        dueDate: new Date(formData.dueDate),
      };
      if (formData.strand) updatePayload.strand = formData.strand;
      if (formData.subStrand) updatePayload.subStrand = formData.subStrand;
      await api.put(`/assignments/${editingAssignment.id}`, updatePayload);
      toast.success('Assignment updated successfully!');
      setEditingAssignment(null);
      resetForm();
      fetchTeacherAssignments();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update assignment';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Assignment deleted');
      fetchTeacherAssignments();
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    try {
      await api.post(`/assignments/${id}/submit-for-approval`);
      toast.success('Assignment submitted for admin approval');
      fetchTeacherAssignments();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to submit for approval';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handlePublishToggle = async (assignment: Assignment) => {
    const newStatus = assignment.status === 'published' ? 'draft' : 'published';
    try {
      await api.put(`/assignments/${assignment.id}`, { status: newStatus });
      toast.success(`Assignment ${newStatus === 'published' ? 'published' : 'unpublished'}`);
      fetchTeacherAssignments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openEditModal = async (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      subject: assignment.subject,
      topic: assignment.topic,
      strand: assignment.strand || '',
      subStrand: assignment.subStrand || '',
      grade: assignment.grade,
      dueDate: assignment.dueDate.split('T')[0],
      totalPoints: assignment.totalPoints,
      questionCount: assignment.questionCount,
    });
    setGeneratedQuestions([]);
    try {
      const res = await api.get(`/assignments/${assignment.id}/questions`);
      setGeneratedQuestions(res.data);
    } catch {
      console.error('Failed to load assignment questions');
    }
  };

  const resetForm = () => {
    const defaultSubject = subjects[0]?.name || 'Mathematics';
    setFormData({
      title: '',
      description: '',
      subject: defaultSubject,
      topic: '',
      strand: '',
      subStrand: '',
      grade: 4,
      dueDate: '',
      totalPoints: 10,
      questionCount: 5,
    });
    setGeneratedQuestions([]);
  };

  const handleGenerateQuestions = async (forceAi = false) => {
    if (!formData.subject || !formData.strand || !formData.subStrand || !formData.grade) {
      toast.error('Please select Subject, Grade, Strand, and Sub-Strand first.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await api.post('/assignments/generate-questions', {
        subject: formData.subject,
        grade: formData.grade,
        strand: formData.strand,
        subStrand: formData.subStrand,
        count: formData.questionCount,
        forceAi,
      });
      setGeneratedQuestions(res.data);
      toast.success(forceAi ? 'Questions generated successfully!' : 'Questions picked successfully!');
    } catch (error) {
      toast.error('Failed to get questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'approved': return 'bg-emerald-100 text-emerald-700';
      case 'draft': return 'bg-amber-100 text-amber-700';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'closed': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getSubmissionStatus = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'graded': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // ========== STUDENT VIEW ==========
  if (isStudent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Assignments</h1>
          <p className="text-slate-500 mt-1">Complete and submit your assignments</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No assignments available for your grade yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const submission = getSubmissionForAssignment(assignment.id);
              return (
                <div key={assignment.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-slate-900 text-lg">{assignment.title}</h3>
                        {submission && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubmissionStatus(submission.status)}`}>
                            {submission.status === 'graded' ? `Graded: ${submission.score}/${submission.totalPoints}` : 'Submitted'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mb-1">{assignment.subject} &bull; {assignment.subStrand || assignment.topic} &bull; Grade {assignment.grade}</p>
                      {assignment.strand && <p className="text-xs text-slate-400 mb-1">Strand: {assignment.strand}</p>}
                      {assignment.description && (
                        <HtmlContent html={assignment.description} className="text-sm text-slate-600 mb-3" renderMath={true} />
                      )}
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {assignment.questionCount} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {assignment.totalPoints} pts
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {submission ? (
                        <button
                          onClick={() => router.push(`/assignments/${assignment.id}/results`)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                        >
                          View Results
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/assignments/${assignment.id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                        >
                          Start Assignment
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ========== TEACHER VIEW ==========
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-500 mt-1">Create and manage assignments</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          Create Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-4">No assignments created yet.</p>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
          >
            Create Your First Assignment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-slate-900 text-lg">{assignment.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">{assignment.subject} &bull; {assignment.subStrand || assignment.topic} &bull; Grade {assignment.grade}</p>
                  {assignment.strand && <p className="text-xs text-slate-400 mb-1">Strand: {assignment.strand} &bull; Sub-Strand: {assignment.subStrand}</p>}
                  {assignment.description && (
                    <HtmlContent html={assignment.description} className="text-sm text-slate-600 mb-3" renderMath={true} />
                  )}
                  <div className="flex items-center gap-6 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {assignment.questionCount} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {assignment.submittedCount} submitted
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {assignment.gradedCount} graded
                    </span>
                    <span className="font-medium text-indigo-600">{assignment.totalPoints} pts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => router.push(`/assignments/${assignment.id}/grade`)}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200"
                    title="View submissions"
                  >
                    <Users className="w-4 h-4" />
                    Submissions
                  </button>
                  <button
                    onClick={() => openEditModal(assignment)}
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-100"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {(assignment.status === 'draft' || assignment.status === 'rejected') && (
                    <button
                      onClick={() => handleSubmitForApproval(assignment.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-yellow-500 text-white rounded-xl text-sm font-medium hover:bg-yellow-600"
                      title="Submit for admin approval"
                    >
                      <Send className="w-4 h-4" />
                      Submit for Approval
                    </button>
                  )}
                  {assignment.status === 'pending_approval' && (
                    <span className="px-3 py-2 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-xl">
                      Awaiting Review
                    </span>
                  )}
                  {assignment.status === 'published' && (
                    <button
                      onClick={() => handlePublishToggle(assignment)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-amber-500 hover:text-amber-600"
                      title="Unpublish"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  {assignment.status === 'approved' && (
                    <button
                      onClick={() => handlePublishToggle(assignment)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-amber-500 hover:text-amber-600"
                      title="Unpublish"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showModal || editingAssignment) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </h2>
            <form onSubmit={editingAssignment ? handleEdit : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Assignment description (supports math formulas via LaTeX)"
                  minHeight={150}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value, topic: '', strand: '', subStrand: '' })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    disabled={!!editingAssignment}
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value), strand: '', subStrand: '' })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    disabled={!!editingAssignment}
                  >
                    {[4, 5, 6, 7, 8, 9].map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Strand</label>
                <select
                  value={formData.strand}
                  onChange={(e) => setFormData({ ...formData, strand: e.target.value, subStrand: '' })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  disabled={!!editingAssignment || curriculumLoading}
                >
                  {curriculumLoading ? (
                    <option value="">Loading strands...</option>
                  ) : curriculumTree.length === 0 ? (
                    <option value="">No strands available</option>
                  ) : (
                    curriculumTree.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sub-Strand</label>
                  <select
                    value={formData.subStrand}
                    onChange={(e) => setFormData({ ...formData, subStrand: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    disabled={!!editingAssignment || !formData.strand}
                  >
                    {!formData.strand ? (
                      <option value="">Select a strand first</option>
                    ) : (
                      (curriculumTree.find((s) => s.name === formData.strand)?.subStrands || []).map((ss) => (
                        <option key={ss.id} value={ss.name}>{ss.name}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Questions</label>
                  <input
                    type="number"
                    value={formData.questionCount}
                    onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    min={1}
                    max={50}
                    disabled={!!editingAssignment}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Points</label>
                  <input
                    type="number"
                    value={formData.totalPoints}
                    onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    min={1}
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Assignment Questions</h3>
                  {!editingAssignment && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateQuestions(false)}
                        disabled={isGenerating || generatedQuestions.length > 0}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 disabled:opacity-50"
                      >
                        {isGenerating ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <BookOpen className="w-4 h-4" />}
                        Smart Pick
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateQuestions(true)}
                        disabled={isGenerating || generatedQuestions.length > 0}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 disabled:opacity-50"
                      >
                        {isGenerating ? <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div> : <Sparkles className="w-4 h-4" />}
                        AI Generate
                      </button>
                    </div>
                  )}
                </div>
                {generatedQuestions.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {generatedQuestions.map((q: any, idx: number) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{idx + 1}</span>
                          <div className="text-sm font-medium text-slate-800">
                            <HtmlContent html={q.content} renderMath={true} />
                          </div>
                        </div>
                        {q.options && (
                          <div className="ml-8 space-y-1">
                            {q.options.map((opt: any, optIdx: number) => (
                              <div key={optIdx} className={`text-xs px-2 py-1 rounded ${opt.isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-500'}`}>
                                {['A', 'B', 'C', 'D'][optIdx]}. {opt.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No questions selected. Click "Generate AI Questions" or create without them.</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingAssignment(null); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                >
                  {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
