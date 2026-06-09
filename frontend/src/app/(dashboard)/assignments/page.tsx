'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FileText, Plus, Clock, Users, CheckCircle, XCircle, ArrowRight, Edit2, Trash2, BookOpen, Star } from 'lucide-react';
import HtmlContent from '@/components/ui/HtmlContent';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  grade: number;
  totalPoints: number;
  dueDate: string;
  status: string;
  questionCount: number;
  submittedCount: number;
  gradedCount: number;
  createdAt: string;
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
    topic: 'Fractions',
    grade: 4,
    dueDate: '',
    totalPoints: 10,
    questionCount: 5,
  });

  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [availableTopics, setAvailableTopics] = useState<{ id: string; name: string }[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

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
      setAvailableTopics([]);
      return;
    }
    const subject = subjects.find((s) => s.name === formData.subject);
    if (!subject) {
      setAvailableTopics([]);
      return;
    }
    setTopicsLoading(true);
    api.get('/topics/by-grade-subject', { params: { grade: formData.grade, subjectId: subject.id } })
      .then((res) => {
        const topics: { id: string; name: string }[] = res.data || [];
        setAvailableTopics(topics);
        if (topics.length > 0 && !topics.some((t) => t.name === formData.topic)) {
          setFormData((prev) => ({ ...prev, topic: topics[0].name }));
        }
        if (topics.length === 0 && formData.topic) {
          setFormData((prev) => ({ ...prev, topic: '' }));
        }
      })
      .catch(() => setAvailableTopics([]))
      .finally(() => setTopicsLoading(false));
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
        ...formData,
        dueDate: new Date(formData.dueDate),
      });
      toast.success('Assignment created successfully!');
      setShowModal(false);
      resetForm();
      fetchTeacherAssignments();
    } catch (error) {
      toast.error('Failed to create assignment');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    try {
      await api.put(`/assignments/${editingAssignment.id}`, {
        title: formData.title,
        description: formData.description,
        totalPoints: formData.totalPoints,
        dueDate: new Date(formData.dueDate),
      });
      toast.success('Assignment updated successfully!');
      setEditingAssignment(null);
      resetForm();
      fetchTeacherAssignments();
    } catch (error) {
      toast.error('Failed to update assignment');
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

  const openEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      subject: assignment.subject,
      topic: assignment.topic,
      grade: assignment.grade,
      dueDate: assignment.dueDate.split('T')[0],
      totalPoints: assignment.totalPoints,
      questionCount: assignment.questionCount,
    });
  };

  const resetForm = () => {
    const defaultSubject = subjects[0]?.name || 'Mathematics';
    setFormData({
      title: '',
      description: '',
      subject: defaultSubject,
      topic: '',
      grade: 4,
      dueDate: '',
      totalPoints: 10,
      questionCount: 5,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-amber-100 text-amber-700';
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
                      <p className="text-sm text-slate-500 mb-3">{assignment.subject} &bull; {assignment.topic} &bull; Grade {assignment.grade}</p>
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
                  <p className="text-sm text-slate-500 mb-3">{assignment.subject} &bull; {assignment.topic} &bull; Grade {assignment.grade}</p>
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
                  <button
                    onClick={() => handlePublishToggle(assignment)}
                    className={`p-2 rounded-xl hover:bg-slate-100 ${
                      assignment.status === 'published' ? 'text-amber-500 hover:text-amber-600' : 'text-green-500 hover:text-green-600'
                    }`}
                    title={assignment.status === 'published' ? 'Unpublish' : 'Publish'}
                  >
                    {assignment.status === 'published' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
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
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value, topic: '' })}
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
                    onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    disabled={!!editingAssignment}
                  >
                    {[4, 5, 6, 7, 8, 9].map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                    disabled={!!editingAssignment || topicsLoading}
                  >
                    {topicsLoading ? (
                      <option value="">Loading topics...</option>
                    ) : availableTopics.length === 0 ? (
                      <option value="">No topics available</option>
                    ) : (
                      availableTopics.map((t) => (
                        <option key={t.id} value={t.name}>{t.name}</option>
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
