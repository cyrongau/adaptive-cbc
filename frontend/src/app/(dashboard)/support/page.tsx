'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  LifeBuoy,
  MessageSquare,
  PlusCircle,
  HelpCircle,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  Upload,
  AlertTriangle,
  Loader,
} from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'academic' | 'technical' | 'billing' | 'general';
  createdAt: string;
  conversation?: {
    id: string;
  };
}

const FAQS = [
  {
    question: 'How do I access my graded assignments?',
    answer: 'Navigate to the "Course Hub" or "Assignments" tab in the sidebar. Select your course, and you will see a list of assignments with their grades, status, and direct tutor feedback.',
    category: 'academic',
  },
  {
    question: 'Why is my video stream buffering?',
    answer: 'buffering is usually caused by low internet bandwidth. Please ensure you have a stable connection of at least 3 Mbps. You can also adjust the playback resolution or contact technical support below.',
    category: 'technical',
  },
  {
    question: 'How is payment billing processed?',
    answer: 'Payments can be made via MPesa or credit/debit card in the "Financial Hub". Once a transaction is completed, a receipts invoice is automatically generated and added to your financial history.',
    category: 'billing',
  },
  {
    question: 'Can I change my registered subjects mid-term?',
    answer: 'Subject changes require authorization. Student accounts must request institutional admin approval, while independent users can request modifications through the support portal.',
    category: 'general',
  },
];

export default function SupportDeskPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'academic' | 'technical' | 'billing' | 'general'>('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/support/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch support tickets', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setErrorMsg('Please fill in the subject and description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSubmitSuccess(false);

    try {
      let attachmentKey = '';

      // Upload file if selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post('/chat/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        attachmentKey = uploadRes.data.key;
      }

      await api.post('/support/tickets', {
        subject,
        description,
        category,
        priority,
        attachmentKey,
      });

      setSubject('');
      setDescription('');
      setCategory('general');
      setPriority('low');
      setFile(null);
      setSubmitSuccess(true);
      fetchTickets();
    } catch (error: any) {
      console.error('Failed to create ticket', error);
      setErrorMsg(error.response?.data?.message || 'Error submitting ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <PlusCircle className="w-3.5 h-3.5" />
            Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-800 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5" />
            Closed
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'low':
        return <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">Low</span>;
      case 'medium':
        return <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-600 border border-amber-200">Medium</span>;
      case 'high':
        return <span className="text-xs px-2 py-0.5 rounded font-medium bg-orange-50 text-orange-600 border border-orange-200">High</span>;
      case 'critical':
        return <span className="text-xs px-2 py-0.5 rounded font-semibold bg-red-100 text-red-600 border border-red-200 animate-pulse">Critical</span>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-100">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Desk</h1>
              <p className="text-sm text-slate-500">Need help? Ask academic or system related questions below.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/chat')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Open Live Inbox
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Create Ticket Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                Submit a Support Ticket
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {submitSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-sm font-medium">Ticket submitted successfully! A private support chat channel has been generated for you.</p>
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <p className="text-sm font-medium">{errorMsg}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-medium bg-slate-50/50"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="academic">Academic / Learning Material</option>
                      <option value="technical">Technical Error</option>
                      <option value="billing">Billing & Subscription</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Priority Level</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-medium bg-slate-50/50"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="critical">Critical (Blocking work)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm bg-slate-50/50 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your issue in detail. If academic, mention the lesson or question number..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm bg-slate-50/50 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Optional Attachment</label>
                  <div className="relative border border-dashed border-slate-200 bg-slate-50/20 hover:bg-slate-50 rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    <span className="text-xs font-medium text-slate-600">
                      {file ? file.name : 'Click or drag photo/file here to attach'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-md shadow-emerald-100 disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Submitting Ticket...
                      </>
                    ) : (
                      'Submit Ticket'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* FAQs Widget */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                Frequently Asked Questions
              </h2>

              <div className="space-y-3">
                {FAQS.map((faq, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50/30 hover:bg-slate-50/70 transition-colors text-left"
                    >
                      <span className="text-sm font-semibold text-slate-800">{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {activeFaq === idx && (
                      <div className="p-4 border-t border-slate-100 bg-white">
                        <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Active Tickets List */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-emerald-600" />
                My Support Tickets
              </h2>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Fetching active tickets...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <LifeBuoy className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-700">No active tickets</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Create a support ticket to get help from your institutional tutors.</p>
                </div>
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-1">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-all space-y-3 bg-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate" title={ticket.subject}>
                            {ticket.subject}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            Created {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>

                      {ticket.conversation && (
                        <button
                          onClick={() => router.push(`/chat?conversationId=${ticket.conversation?.id}`)}
                          className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                        >
                          Open Chat Ticket
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
