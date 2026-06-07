'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  HelpCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  MessageSquare,
  Filter,
  Check,
  RotateCcw,
  Loader,
  Search,
  UserCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: string;
  userId: string;
  assignedAgentId?: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
  user: UserDetail;
  assignedAgent?: UserDetail;
}

function AdminSupportQueue() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all'); // all, unassigned, mine

  // User search & DM initiation states
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserDetail[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [initiatingChatUserId, setInitiatingChatUserId] = useState<string | null>(null);

  const handleUserSearchChange = async (val: string) => {
    setUserSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchingUsers(true);
      const res = await api.get(`/users/search?q=${encodeURIComponent(val)}`);
      setSearchResults(res.data);
    } catch (error) {
      console.error('Failed to search users', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleInitiateAdminChat = async (targetUserId: string) => {
    try {
      setInitiatingChatUserId(targetUserId);
      const res = await api.post('/chat/conversations', {
        type: 'admin_initiated',
        participantIds: [targetUserId],
      });
      toast.success('Conversation initiated successfully!');
      router.push(`/admin/chat?conversationId=${res.data.id}`);
    } catch (error) {
      console.error('Failed to initiate conversation', error);
      toast.error('Failed to initiate chat conversation.');
    } finally {
      setInitiatingChatUserId(null);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/support/tickets');
      setTickets(res.data);
    } catch (error) {
      console.error('Failed to load support tickets', error);
      toast.error('Failed to retrieve support tickets.');
    } finally {
      setLoading(false);
    }
  };

  // Assign ticket to current admin
  const handleAssignToMe = async (ticketId: string) => {
    if (!user) return;
    try {
      const res = await api.put(`/support/tickets/${ticketId}`, {
        assignedAgentId: user.id,
        status: 'in_progress',
      });
      toast.success('Ticket assigned to you and set to In Progress!');
      
      // Update ticket list state locally
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, ...res.data } : t))
      );
    } catch (error) {
      console.error('Failed to assign ticket', error);
      toast.error('Assignment failed.');
    }
  };

  // Update Status
  const handleStatusChange = async (ticketId: string, status: 'open' | 'in_progress' | 'closed') => {
    try {
      const res = await api.put(`/support/tickets/${ticketId}`, { status });
      toast.success(`Ticket status set to ${status.replace('_', ' ')}!`);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, ...res.data } : t))
      );
    } catch (error) {
      console.error('Status update failed', error);
      toast.error('Status update failed.');
    }
  };

  // Update Priority
  const handlePriorityChange = async (ticketId: string, priority: 'low' | 'medium' | 'high') => {
    try {
      const res = await api.put(`/support/tickets/${ticketId}`, { priority });
      toast.success(`Ticket priority set to ${priority}!`);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, ...res.data } : t))
      );
    } catch (error) {
      console.error('Priority update failed', error);
      toast.error('Priority update failed.');
    }
  };

  // Get Stats
  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
    highPriority: tickets.filter((t) => t.priority === 'high' && t.status !== 'closed').length,
  };

  // Filters application
  const filteredTickets = tickets.filter((ticket) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const subjectMatch = ticket.subject.toLowerCase().includes(q);
      const userMatch =
        ticket.user.firstName.toLowerCase().includes(q) ||
        ticket.user.lastName.toLowerCase().includes(q) ||
        ticket.user.email.toLowerCase().includes(q);
      if (!subjectMatch && !userMatch) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;

    // Priority filter
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;

    // Assignment filter
    if (assignmentFilter === 'unassigned' && ticket.assignedAgentId) return false;
    if (assignmentFilter === 'mine' && ticket.assignedAgentId !== user?.id) return false;

    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-emerald-600 animate-pulse" />
            Support Desk Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage student, teacher, and parent inquiries. Update priorities, assign agents, and respond via real-time chat.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setShowSearchPanel(!showSearchPanel)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              showSearchPanel 
                ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {showSearchPanel ? 'Close User Search' : 'Search & Chat with User'}
          </button>

          <button
            onClick={fetchTickets}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh Tickets
          </button>
        </div>
      </div>

      {/* User Search & Chat Initiation Panel */}
      {showSearchPanel && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Direct Message / Support Chat Search</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Search for any registered user (student, teacher, or parent) within your scope to initiate an administrative direct chat.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={userSearchQuery}
                onChange={(e) => handleUserSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-slate-50/50"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchingUsers ? (
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <Loader className="w-6 h-6 text-emerald-600 animate-spin" />
              <span className="text-xs text-slate-400 mt-2 font-medium">Searching matching users...</span>
            </div>
          ) : userSearchQuery.trim() === '' ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs font-semibold text-slate-500">Type a name or email to search</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Searches are case-insensitive and support partial matches.</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs font-semibold text-slate-500">No users found matching "{userSearchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((userItem) => (
                <div key={userItem.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all hover:bg-slate-50">
                  <div className="min-w-0 flex-1 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs border border-emerald-100 uppercase shrink-0">
                      {userItem.firstName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">{userItem.firstName} {userItem.lastName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{userItem.email}</div>
                      <div className="inline-block px-1.5 py-0.5 mt-1 rounded text-[8px] font-bold bg-slate-100 border border-slate-200 text-slate-500 uppercase tracking-wide">
                        {userItem.role.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInitiateAdminChat(userItem.id)}
                    disabled={initiatingChatUserId === userItem.id}
                    className="ml-3 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {initiatingChatUserId === userItem.id ? (
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5" />
                    )}
                    Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Queries</span>
          <span className="text-2xl font-extrabold text-slate-800 mt-2">{stats.total}</span>
          <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            All registered issues
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Open Tickets</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-2">{stats.open}</span>
          <span className="text-[9px] text-emerald-500/70 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Awaiting triage
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">In Progress</span>
          <span className="text-2xl font-extrabold text-blue-600 mt-2">{stats.inProgress}</span>
          <span className="text-[9px] text-blue-500/70 mt-1 flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            Assigned to agent
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved</span>
          <span className="text-2xl font-extrabold text-slate-500 mt-2">{stats.closed}</span>
          <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            Completed cases
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Critical Priority</span>
          <span className="text-2xl font-extrabold text-rose-600 mt-2">{stats.highPriority}</span>
          <span className="text-[9px] text-rose-500/70 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 animate-bounce" />
            High priority & open
          </span>
        </div>

      </div>

      {/* Filters Dashboard */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by subject, student name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-slate-50/50"
            />
          </div>

          {/* Filter selects */}
          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Assignments</option>
                <option value="unassigned">Unassigned</option>
                <option value="mine">Assigned to Me</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs text-slate-400 mt-2 font-medium">Loading ticket records...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-16 text-center">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No support tickets match filters</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting filters or checking back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Ticket Details</th>
                  <th className="px-6 py-4">Creator</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                {filteredTickets.map((ticket) => {
                  
                  const getPriorityStyle = (p: string) => {
                    switch (p) {
                      case 'high':
                        return 'bg-rose-50 border-rose-100 text-rose-700';
                      case 'medium':
                        return 'bg-amber-50 border-amber-100 text-amber-700';
                      default:
                        return 'bg-slate-50 border-slate-200 text-slate-600';
                    }
                  };

                  const getStatusStyle = (s: string) => {
                    switch (s) {
                      case 'closed':
                        return 'bg-slate-100 border-slate-200 text-slate-500';
                      case 'in_progress':
                        return 'bg-blue-50 border-blue-100 text-blue-700';
                      default:
                        return 'bg-emerald-50 border-emerald-100 text-emerald-700';
                    }
                  };

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Ticket Details */}
                      <td className="px-6 py-4 max-w-sm">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                            {ticket.category.replace('_', ' ')}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1.5">{ticket.subject}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{ticket.description}</p>
                          <p className="text-[9px] text-slate-400 font-medium mt-1">
                            Opened {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                            {ticket.user.firstName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{ticket.user.firstName} {ticket.user.lastName}</div>
                            <div className="text-[9px] text-slate-400 capitalize">{ticket.user.role.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={ticket.priority}
                          onChange={(e) => handlePriorityChange(ticket.id, e.target.value as any)}
                          className={`
                            px-2 py-1.5 rounded-lg text-[10px] font-bold border outline-none cursor-pointer capitalize transition-all
                            ${getPriorityStyle(ticket.priority)}
                          `}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value as any)}
                          className={`
                            px-2 py-1.5 rounded-lg text-[10px] font-bold border outline-none cursor-pointer capitalize transition-all
                            ${getStatusStyle(ticket.status)}
                          `}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>

                      {/* Agent */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {ticket.assignedAgent ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{ticket.assignedAgent.firstName} {ticket.assignedAgent.lastName}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAssignToMe(ticket.id)}
                            className="px-2 py-1 rounded-lg border border-emerald-100 hover:border-emerald-200 text-[10px] text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 font-bold transition-all flex items-center gap-1 shadow-sm"
                          >
                            <UserCheck className="w-3 h-3" />
                            Claim Ticket
                          </button>
                        )}
                      </td>

                      {/* Chat navigation */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {ticket.conversationId ? (
                          <button
                            onClick={() => router.push(`/admin/chat?conversationId=${ticket.conversationId}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            Open Chat
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No Chat Attached</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-screen bg-slate-50">
        <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-400 mt-2 font-medium">Loading Support Desk...</p>
      </div>
    }>
      <AdminSupportQueue />
    </Suspense>
  );
}
