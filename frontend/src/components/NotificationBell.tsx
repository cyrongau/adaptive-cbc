'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  actionUrl?: string;
  icon?: string;
  createdAt: string;
}

export default function NotificationBell() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=10');
      setNotifications(res.data);
    } catch { /* ignore */ }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count ?? res.data);
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const getRoleLabel = () => {
    if (!user) return '';
    switch (user.role) {
      case 'student': return 'Student';
      case 'parent': return 'Parent';
      case 'teacher': return 'Teacher';
      case 'tutor': return 'Tutor';
      case 'super_admin': return 'Admin';
      case 'institution_admin': return 'Institution Admin';
      default: return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'academic': return '📚';
      case 'payment': return '💰';
      case 'security': return '🔒';
      case 'reminder': return '⏰';
      case 'social': return '🎉';
      default: return 'ℹ️';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Notifications</h3>
                <p className="text-[10px] text-slate-400 font-medium">{getRoleLabel()} • {unreadCount} unread</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-[#47a263] hover:text-[#3d8b55] font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">No notifications yet</p>
                  <p className="text-xs text-slate-300 mt-1">We'll let you know when something arrives</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.isRead) handleMarkAsRead(n.id); }}
                    className={`px-5 py-3 border-b border-slate-50 last:border-b-0 transition-colors cursor-pointer ${!n.isRead ? 'bg-[#47a263]/5 hover:bg-[#47a263]/10' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-base leading-none mt-0.5">{getTypeIcon(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs ${!n.isRead ? 'font-extrabold text-slate-900' : 'font-medium text-slate-600'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#47a263] shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-300 font-medium">{timeAgo(n.createdAt)}</span>
                          {n.actionUrl && (
                            <Link href={n.actionUrl} onClick={e => e.stopPropagation()} className="text-[10px] text-[#47a263] hover:underline font-semibold">
                              View →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
