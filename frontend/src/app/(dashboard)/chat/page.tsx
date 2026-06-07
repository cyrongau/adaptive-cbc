'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import {
  MessageSquare,
  Send,
  Paperclip,
  Users,
  Search,
  Check,
  CheckCheck,
  User,
  PlusCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Loader,
  X,
  ChevronLeft,
  FileIcon,
  Circle,
  CornerUpLeft,
  Smile,
  Info,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ChatUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ChatMessage {
  id: string;
  message: string;
  attachmentKey?: string;
  attachmentUrl?: string;
  createdAt: string;
  sender: ChatUser;
  replyToId?: string;
  replyTo?: {
    id: string;
    message: string;
    sender: ChatUser;
  };
}

interface ChatConversation {
  id: string;
  type: 'support' | 'direct' | 'admin' | 'community' | 'teacher_student' | 'admin_initiated';
  name?: string;
  ticket?: {
    id: string;
    subject: string;
    status: string;
    priority: string;
  };
  participants: ChatUser[];
  messages: ChatMessage[];
  unreadCount?: number;
}

const EMOJI_CATEGORIES = {
  smileys: { icon: '😊', label: 'Smileys', emojis: ['😊', '😂', '🤣', '😍', '🥰', '😘', '😜', '🤔', '🤨', '🙄', '😬', '😔', '😢', '😭', '😡', '🤬', '😱', '🤯', '😴', '😇', '😎', '🧐', '🤠', '🥳', '🥺'] },
  gestures: { icon: '👍', label: 'Gestures', emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '👐', '🤲', '✊', '👊', '🤜', '🤛', '✍️', '👋', '🤳', '💪', '🧠', '👀', '👤', '👥'] },
  nature: { icon: '🐱', label: 'Animals', emojis: ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🐝', '🦄', '🦖', '🐉', '🌴', '🌲', '🍀', '🌸'] },
  food: { icon: '🍕', label: 'Food', emojis: ['🍏', '🍎', '🍌', '🍉', '🍇', '🍓', '🍒', '🍍', '🍕', '🍔', '🍟', '🌭', '🌮', '🥗', '🍿', '🍪', '🎂', '🍰', '🍫', '☕', '🍵', '🥤', '🍺', '🍷'] },
  activities: { icon: '⚽', label: 'Sports', emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🥊', '🥋', '🎨', '🎭', '🎮', '🎲', '🎸', '🎹', '🥁', '🎤', '🎧', '🏆', '🥇'] },
  places: { icon: '🚀', label: 'Travel', emojis: ['🚗', '🚕', '🚙', '🚌', '🏎️', '🏍️', '🚲', '✈️', '🚀', '🛸', '⛵', '⚓', '🗺️', '🗼', '🗽', '🗻', '🌋', '🏕️', '🏖️', '🏠', '🏢', '🏫', '🏥', '🏛️'] },
  objects: { icon: '💻', label: 'Objects', emojis: ['💻', '📱', '⌚', '⌨️', '🖱️', '🖨️', '📷', '📽️', '💿', '📁', '📂', '📄', '📅', '✏️', '✒️', '📝', '✉️', '📦', '🔔', '🔑', '🔨', '🔧', '💡', '📖', '📚'] },
  symbols: { icon: '❤️', label: 'Flags', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '🔣', 'ℹ️', '⚠️', '🛑', '🚩', '🏁', '🇺🇸', '🇬🇧', '🇯🇵', '🇩🇪', '🇨🇦', '🇰🇪'] }
};

function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConv, setActiveConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'support' | 'community'>('all');

  // WebSocket socket
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeConvRef = useRef<ChatConversation | null>(null);

  // Keep ref synchronized with state to prevent stale closures in event listeners
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  // Typing states
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Attachment upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; key: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Replying state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Emoji keyboard state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
  const [emojiSearch, setEmojiSearch] = useState('');
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Mentions autocomplete states
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchList, setMentionSearchList] = useState<ChatUser[]>([]);

  // Responsive mobile state
  const [showLeftPane, setShowLeftPane] = useState(true);

  // Click outside listener for emoji picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);

      // Deep link conversation if id is in query params
      const paramId = searchParams.get('conversationId');
      if (paramId) {
        const found = res.data.find((c: ChatConversation) => c.id === paramId);
        if (found) {
          selectConversation(found);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations', error);
    } finally {
      setLoadingConv(false);
    }
  };

  // 2. Setup WebSocket Connection
  useEffect(() => {
    if (!user) return;

    // Connect to /chat namespace on backend port 3002
    const wsUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
      : 'http://localhost:3002';

    const socket = io(`${wsUrl}/chat`, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Chat Socket Gateway!');
      // Rejoin conversation if it was selected and socket reconnected
      if (activeConvRef.current) {
        socket.emit('joinConversation', { conversationId: activeConvRef.current.id });
      }
    });

    // Listen for incoming messages
    socket.on('messageReceived', (message: ChatMessage & { conversationId: string }) => {
      // If message is for the active conversation, append it
      if (activeConvRef.current && message.conversationId === activeConvRef.current.id) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        // Mark as read immediately
        api.post(`/chat/messages/${activeConvRef.current.id}/read`).catch(() => {});
      } else {
        // Increment unread count in conversations list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === message.conversationId
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
              : c
          )
        );
      }
    });

    // Listen for typing events
    socket.on('typing', (payload: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
      if (activeConvRef.current && payload.conversationId === activeConvRef.current.id && payload.userId !== user.id) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          if (payload.isTyping) {
            next[payload.userId] = payload.userName;
          } else {
            delete next[payload.userId];
          }
          return next;
        });
      }
    });

    // Listen for unread notification updates
    socket.on('unreadUpdate', (payload: { conversationId: string; unreadCount: number }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === payload.conversationId
            ? { ...c, unreadCount: (c.unreadCount || 0) + payload.unreadCount }
            : c
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // 3. Room subscriptions (join/leave rooms when conversation changes)
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    if (activeConv) {
      socket.emit('joinConversation', { conversationId: activeConv.id });
    }

    return () => {
      if (activeConv) {
        socket.emit('leaveConversation', { conversationId: activeConv.id });
      }
    };
  }, [activeConv]);

  // 4. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // 5. Select a conversation
  const selectConversation = async (conv: ChatConversation) => {
    setActiveConv(conv);
    setLoadingMessages(true);
    setTypingUsers({});
    setAttachment(null);
    setReplyingTo(null);
    setShowLeftPane(false);

    try {
      const res = await api.get(`/chat/messages/${conv.id}`);
      setMessages(res.data);
      // Mark read
      await api.post(`/chat/messages/${conv.id}/read`);
      // Update unread count local state
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 5. Input Text Handler (Typing notifications + Mentions check)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Trigger typing event
    if (!socketRef.current || !activeConv || !user) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketRef.current.emit('typing', { conversationId: activeConv.id, isTyping: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketRef.current?.emit('typing', { conversationId: activeConv.id, isTyping: false });
    }, 2000);

    // Check for Mention trigger in group/community chat
    if (activeConv.type === 'community') {
      const lastChar = val[val.length - 1];
      const mentionIndex = val.lastIndexOf('@');
      
      if (mentionIndex !== -1 && (mentionIndex === 0 || val[mentionIndex - 1] === ' ')) {
        const query = val.slice(mentionIndex + 1);
        const searchList = activeConv.participants.filter(p =>
          p.id !== user.id &&
          (`${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()) || query === '')
        );
        setMentionSearchList(searchList);
        setShowMentionDropdown(searchList.length > 0);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Selecting a user to mention
  const handleSelectMention = (p: ChatUser) => {
    const mentionIndex = inputText.lastIndexOf('@');
    if (mentionIndex !== -1) {
      const textBefore = inputText.slice(0, mentionIndex);
      const newText = `${textBefore}@${p.firstName} ${p.lastName} `;
      setInputText(newText);
    }
    setShowMentionDropdown(false);
  };

  // 6. File Attachment Upload Flow
  const triggerAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await api.post('/chat/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAttachment({
          url: res.data.attachmentUrl,
          key: res.data.attachmentKey,
        });
      } catch (err) {
        console.error('File upload failed', err);
      } finally {
        setUploadingFile(false);
      }
    }
  };

  // 7. Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;

    if (socketRef.current && activeConv) {
      socketRef.current.emit('sendMessage', {
        conversationId: activeConv.id,
        message: inputText,
        attachmentKey: attachment?.key || undefined,
        replyToId: replyingTo?.id || undefined,
      });

      // Clear states
      setInputText('');
      setAttachment(null);
      setReplyingTo(null);
      setShowEmojiPicker(false);

      // Stop typing
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socketRef.current.emit('typing', { conversationId: activeConv.id, isTyping: false });
      }
    }
  };

  // Append Emoji to input text
  const appendEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  // Highlights user mentions
  const renderMessageText = (text: string, participants: ChatUser[]) => {
    if (!text) return null;
    
    // Sort participants by name length descending to avoid greedy splits
    const sortedParticipants = [...participants].sort(
      (a, b) => `${b.firstName} ${b.lastName}`.length - `${a.firstName} ${a.lastName}`.length
    );
    
    let parts: React.ReactNode[] = [text];
    
    for (const p of sortedParticipants) {
      const name = `${p.firstName} ${p.lastName}`;
      const mentionStr = `@${name}`;
      
      const nextParts: React.ReactNode[] = [];
      for (const part of parts) {
        if (typeof part !== 'string') {
          nextParts.push(part);
          continue;
        }
        
        const subparts = part.split(mentionStr);
        for (let i = 0; i < subparts.length; i++) {
          if (i > 0) {
            const isCurrentUser = p.id === user?.id;
            nextParts.push(
              <span
                key={`${p.id}-${i}`}
                className={`
                  px-1.5 py-0.5 rounded-md font-bold text-[10px] inline-block mx-0.5 select-none transition-all
                  ${
                    isCurrentUser
                      ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }
                `}
              >
                @{name}
              </span>
            );
          }
          if (subparts[i]) {
            nextParts.push(subparts[i]);
          }
        }
      }
      parts = nextParts;
    }
    
    return <>{parts}</>;
  };

  const isUserMentioned = (msgText: string) => {
    if (!user || !msgText) return false;
    const name = `${user.firstName} ${user.lastName}`;
    return msgText.includes(`@${name}`);
  };

  // 8. Filters & Search helper
  const filteredConversations = conversations.filter((c) => {
    // Tab filter
    // Tab filter
    if (activeTab !== 'all') {
      if (activeTab === 'direct') {
        if (c.type !== 'teacher_student' && c.type !== 'admin_initiated' && (c.type as string) !== 'direct') {
          return false;
        }
      } else {
        if (c.type !== activeTab) return false;
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = c.name?.toLowerCase().includes(query);
      const ticketMatch = c.ticket?.subject.toLowerCase().includes(query);
      const participantMatch = c.participants.some(
        (p) =>
          p.firstName.toLowerCase().includes(query) ||
          p.lastName.toLowerCase().includes(query)
      );
      return nameMatch || ticketMatch || participantMatch;
    }

    return true;
  });

  const getConversationDetails = (conv: ChatConversation) => {
    if (conv.type === 'support') {
      return {
        title: conv.ticket?.subject || 'Support Ticket Help',
        subtitle: `Priority: ${conv.ticket?.priority || 'low'} • Status: ${conv.ticket?.status || 'open'}`,
        icon: HelpCircle,
        bg: 'from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100',
      };
    } else if (conv.type === 'community') {
      return {
        title: conv.name || 'Student Community Room',
        subtitle: `${conv.participants.length} Active Participants`,
        icon: Users,
        bg: 'from-blue-50 to-indigo-50 text-blue-700 border-blue-100',
      };
    } else {
      // Direct message: show other participant's name
      const otherUser = conv.participants.find((p) => p.id !== user?.id);
      const name = otherUser
        ? `${otherUser.firstName} ${otherUser.lastName}`
        : 'Direct Conversation';
      const role = otherUser ? otherUser.role.replace('_', ' ') : 'User';
      return {
        title: name,
        subtitle: role.charAt(0).toUpperCase() + role.slice(1),
        icon: User,
        bg: 'from-slate-50 to-slate-100 text-slate-700 border-slate-200',
      };
    }
  };

  return (
    <div className="flex-1 flex bg-slate-50 overflow-hidden h-[calc(100vh-64px)] relative">
      
      {/* LEFT PANE: Conversations list */}
      <div
        className={`
          ${showLeftPane ? 'flex' : 'hidden'} 
          md:flex flex-col w-full md:w-80 lg:w-96 border-r border-slate-200/80 bg-white shrink-0 h-full
        `}
      >
        {/* Search */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600 animate-bounce-slow" />
            Active Inbox
          </h1>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-slate-50/50"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex px-4 py-2 border-b border-slate-100 gap-1 bg-slate-50/30 overflow-x-auto shrink-0">
          {(['all', 'direct', 'support', 'community'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all
                ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }
              `}
            >
              {tab === 'all' ? 'All Channels' : tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {loadingConv ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-48">
              <Loader className="w-6 h-6 text-emerald-600 animate-spin" />
              <span className="text-xs text-slate-400 mt-2 font-medium">Loading inbox channels...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 m-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No conversations found</p>
              <p className="text-[10px] text-slate-400 mt-1">Chat channels appear here once initiated.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const details = getConversationDetails(conv);
              const Icon = details.icon;
              const isActive = activeConv?.id === conv.id;
              
              // Get last message snippet
              const lastMsg = conv.messages && conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1]
                : null;

              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`
                    w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group
                    ${
                      isActive
                        ? 'bg-emerald-50/70 border border-emerald-100 shadow-sm'
                        : 'border border-transparent hover:bg-slate-50/80'
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${details.bg} flex items-center justify-center shrink-0 shadow-sm border`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`text-xs font-bold truncate ${isActive ? 'text-emerald-950' : 'text-slate-900'}`}>
                        {details.title}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium shrink-0">
                        {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-emerald-700/80 font-medium' : 'text-slate-500'}`}>
                      {details.subtitle}
                    </p>
                    {lastMsg && (
                      <p className="text-[10px] text-slate-400 truncate mt-1">
                        <span className="font-semibold">{lastMsg.sender?.id === user?.id ? 'You: ' : `${lastMsg.sender?.firstName || 'User'}: `}</span>
                        {lastMsg.message || 'Sent an attachment'}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount && conv.unreadCount > 0 ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-extrabold shadow-sm animate-pulse shrink-0 self-center">
                      {conv.unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANE: Chat View */}
      <div
        className={`
          ${!showLeftPane ? 'flex' : 'hidden'} 
          md:flex flex-col flex-1 h-full bg-slate-50
        `}
      >
        {activeConv ? (
          <>
            {/* Active Header */}
            <div className="h-16 px-4 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setShowLeftPane(true)}
                  className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm font-extrabold text-slate-900 truncate">
                    {getConversationDetails(activeConv).title}
                  </h2>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Circle className="w-2 h-2 text-emerald-500 fill-emerald-500" />
                    {getConversationDetails(activeConv).subtitle}
                  </p>
                </div>
              </div>

              {activeConv.type === 'support' && activeConv.ticket && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 uppercase tracking-wide">
                  Ticket Status: {activeConv.ticket.status}
                </span>
              )}
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center p-8 h-full">
                  <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Fetching conversation history...</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender?.id === user?.id;
                  const isMentioned = isUserMentioned(msg.message);
                  
                  // MinIO URL Helper
                  const getAttachmentUrl = (msg: ChatMessage) => {
                    if (msg.attachmentUrl) return msg.attachmentUrl;
                    const key = msg.attachmentKey;
                    if (!key) return '';
                    const minioHost = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9003';
                    return `${minioHost}/adaptive-cbc-files/${key}`;
                  };

                  const isImage = (key: string) => {
                    const ext = key.split('.').pop()?.toLowerCase();
                    return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
                  };

                  // Alternating Color Styling
                  const bubbleStyle = isOwn
                    ? user?.role === 'super_admin'
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white rounded-tr-none border border-amber-400 shadow-amber-100'
                      : user?.role === 'institution_admin'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-tr-none border border-teal-500 shadow-teal-100'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none border border-emerald-500 shadow-emerald-50/50'
                    : msg.sender?.role === 'super_admin'
                    ? 'bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-950 rounded-tl-none border-2 border-amber-400/80 ring-2 ring-amber-100/50 shadow-amber-50'
                    : msg.sender?.role === 'institution_admin'
                    ? 'bg-gradient-to-r from-teal-50 to-teal-100/80 text-teal-950 rounded-tl-none border-2 border-teal-400/80 ring-2 ring-teal-100/50 shadow-teal-50'
                    : isMentioned
                    ? 'bg-gradient-to-r from-rose-50 to-amber-50 text-slate-900 rounded-tl-none border-2 border-rose-300 ring-4 ring-rose-100 shadow-rose-50'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80 shadow-slate-100';

                  const senderRole = (msg.sender?.role || 'user').replace('_', ' ');
                  const formattedRole = senderRole.charAt(0).toUpperCase() + senderRole.slice(1);

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] relative group ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 self-start">
                        {msg.sender?.firstName?.charAt(0) || 'U'}
                      </div>

                      {/* Content Container */}
                      <div className="space-y-1">
                        
                        {/* Bubble Header: Sender Details */}
                        <div className={`flex items-center gap-1.5 ${isOwn ? 'justify-end' : ''}`}>
                          <span className="text-[10px] font-extrabold text-slate-800">
                            {isOwn ? 'You' : `${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}`.trim() || 'User'}
                          </span>
                          <span className={`text-[8px] font-semibold px-1 py-0.2 rounded border ${
                            isOwn 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {formattedRole}
                          </span>
                          <span className="text-[8px] text-slate-400 font-medium">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Reply reference preview (if message is a reply to another message) */}
                        {msg.replyTo && (
                          <div className={`
                            flex items-center gap-1.5 text-[9px] p-2 rounded-xl mb-1 border leading-tight truncate max-w-sm
                            ${isOwn ? 'bg-black/25 text-white/95 border-white/10' : 'bg-slate-200 text-slate-700 border-slate-300'}
                          `}>
                            <CornerUpLeft className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="font-extrabold shrink-0">{msg.replyTo.sender?.firstName || 'User'}:</span>
                            <span className="truncate italic">"{msg.replyTo.message}"</span>
                          </div>
                        )}

                        {/* Message Bubble Body */}
                        <div className={`px-4 py-2.5 rounded-2xl text-xs shadow-sm leading-relaxed ${bubbleStyle}`}>
                          {msg.message && (
                            <p className="whitespace-pre-wrap">{renderMessageText(msg.message, activeConv.participants)}</p>
                          )}

                          {/* Attachment Rendering */}
                          {msg.attachmentKey && (
                            <div className="mt-2 pt-2 border-t border-slate-100/20">
                              {isImage(msg.attachmentKey) ? (
                                <img
                                  src={getAttachmentUrl(msg)}
                                  alt="Chat upload"
                                  className="max-w-[200px] max-h-[200px] rounded-lg border border-slate-200 shadow-sm"
                                  loading="lazy"
                                />
                              ) : (
                                <a
                                  href={getAttachmentUrl(msg)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold underline text-blue-500 hover:text-blue-600"
                                >
                                  <FileIcon className="w-4 h-4" />
                                  View Attached File
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reply Overlay Trigger Button (on hover) */}
                      <div className={`
                        absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1
                        ${isOwn ? 'left-0 -translate-x-10' : 'right-0 translate-x-10'}
                      `}>
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm"
                          title="Reply to message"
                        >
                          <CornerUpLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex gap-2 items-center text-[10px] text-slate-400 italic font-medium p-1">
                  <Loader className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>{Object.values(typingUsers).join(', ')} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar Panels Container (Mentions dropdown, Reply preview, Emoji Picker, File preview) */}
            <div className="border-t border-slate-200/80 bg-white relative">
              
              {/* MENTIONS AUTOCOMPLETE DROPDOWN */}
              {showMentionDropdown && mentionSearchList.length > 0 && (
                <div className="absolute bottom-full left-4 bg-white border border-slate-200 rounded-2xl shadow-xl w-64 max-h-48 overflow-y-auto z-40 p-2 space-y-1 flex flex-col mb-2">
                  <span className="text-[9px] font-extrabold text-slate-400 px-2 py-1 uppercase tracking-wider block">Mention Group Member</span>
                  {mentionSearchList.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleSelectMention(member)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl text-left transition-colors"
                    >
                      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {member.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{member.firstName} {member.lastName}</div>
                        <div className="text-[8px] text-slate-400 capitalize">{member.role.replace('_', ' ')}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* EMOJI KEYBOARD PICKER DRAW */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-full right-4 bg-white border border-slate-200 rounded-2xl shadow-xl w-72 h-80 z-40 flex flex-col mb-2 overflow-hidden"
                >
                  {/* Category switcher */}
                  <div className="flex overflow-x-auto gap-0.5 border-b border-slate-100 bg-slate-50 p-1.5 shrink-0 select-none">
                    {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map((catKey) => {
                      const cat = EMOJI_CATEGORIES[catKey];
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => {
                            setActiveEmojiTab(catKey);
                            setEmojiSearch('');
                          }}
                          className={`
                            p-1.5 rounded-lg text-xs hover:bg-slate-200 transition-colors shrink-0
                            ${activeEmojiTab === catKey ? 'bg-white shadow-sm border border-slate-200' : ''}
                          `}
                          title={cat.label}
                        >
                          <span>{cat.icon}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Emoji Search Box */}
                  <div className="p-2 border-b border-slate-100 shrink-0">
                    <input
                      type="text"
                      placeholder="Search emojis..."
                      value={emojiSearch}
                      onChange={(e) => setEmojiSearch(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                    />
                  </div>

                  {/* Emojis Grid */}
                  <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-6 gap-2">
                    {(() => {
                      let emojisList = EMOJI_CATEGORIES[activeEmojiTab].emojis;
                      if (emojiSearch.trim()) {
                        // Very simple fuzzy list check by searching matching tags
                        emojisList = Object.values(EMOJI_CATEGORIES)
                          .flatMap(c => c.emojis)
                          .filter(e => e.includes(emojiSearch)); // Standard search check
                      }

                      return emojisList.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => appendEmoji(emoji)}
                          className="w-8 h-8 rounded-lg text-base hover:bg-slate-100 transition-colors flex items-center justify-center select-none"
                        >
                          {emoji}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* REPLY TO MESSAGE PREVIEW HEADER */}
              {replyingTo && (
                <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-600 font-medium shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <CornerUpLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span>Replying to </span>
                      <span className="font-extrabold">{replyingTo.sender?.firstName || 'User'}</span>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">"{replyingTo?.message}"</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* FILE ATTACHMENT PREVIEW HEADER */}
              {attachment && (
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-600 font-medium shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ready to send attachment: </span>
                    <span className="font-bold underline truncate max-w-[200px]">{attachment.key}</span>
                  </div>
                  <button
                    onClick={() => setAttachment(null)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input Form Action Row */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 flex items-center gap-2.5"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {/* Paperclip Button */}
                <button
                  type="button"
                  onClick={triggerAttachment}
                  disabled={uploadingFile}
                  className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                  title="Add Attachment"
                >
                  {uploadingFile ? (
                    <Loader className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </button>

                {/* Text Input */}
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder={activeConv.type === 'community' ? "Type message... use @ to tag members" : "Type your message..."}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-slate-50/50"
                  />
                  
                  {/* Toggle Emoji picker Button inside the input field */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`absolute right-3 text-slate-400 hover:text-slate-700 transition-colors`}
                    title="Insert emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  className="p-2.5 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-md shadow-emerald-100 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md border border-slate-100 mb-4 animate-bounce-slow">
              <MessageSquare className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Select a Conversation</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[280px] leading-relaxed">
              Choose an active academic community or support conversation from the sidebar to begin messaging in real-time.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-screen bg-slate-50">
        <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-400 mt-2 font-medium">Loading inbox UI...</p>
      </div>
    }>
      <ChatInterface />
    </Suspense>
  );
}
