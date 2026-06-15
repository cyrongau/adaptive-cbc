'use client';

import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, Users, Plus, Play, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface SessionUI {
  id: string;
  student: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  status: 'upcoming' | 'completed';
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionUI[]>([]);
  const [stats, setStats] = useState({ total: 0, week: 0, completed: 0, hours: 0 });
  const router = useRouter();
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'teacher' || user?.role === 'tutor' || user?.role === 'super_admin';

  useEffect(() => {
    fetchSessions();
  }, [isTeacher]);

  const fetchSessions = async () => {
    try {
      let allLessons: any[] = [];
      if (isTeacher) {
        const res = await api.get('/lessons/my-lessons');
        allLessons = res.data || [];
      } else {
        const res = await api.get('/lessons/timetable');
        const timetable = res.data?.timetable || [];
        timetable.forEach((day: any) => {
          allLessons.push(...day.lessons);
        });
      }

      const liveSessions = allLessons.filter(l => l.isLive === true);

      let totalHours = 0;
      let completedCount = 0;

      const formatted: SessionUI[] = liveSessions.map(l => {
        const start = new Date(`1970-01-01T${l.startTime}Z`);
        const end = new Date(`1970-01-01T${l.endTime}Z`);
        let durationMin = (end.getTime() - start.getTime()) / 60000;
        if (durationMin < 0 || isNaN(durationMin)) durationMin = 60;

        if (l.status === 'completed') {
          completedCount++;
          totalHours += durationMin / 60;
        }

        return {
          id: l.id,
          student: isTeacher ? `Grade ${l.grade || 'Any'} Class` : l.teacher?.firstName ? `Tr. ${l.teacher.firstName}` : 'Class',
          subject: l.subject,
          date: l.date || `Weekly on ${l.dayOfWeek}`,
          time: l.startTime.slice(0, 5),
          duration: `${durationMin} min`,
          status: l.status === 'completed' ? 'completed' : 'upcoming',
        };
      });

      setSessions(formatted);
      setStats({
        total: liveSessions.length,
        week: liveSessions.length,
        completed: completedCount,
        hours: Math.round(totalHours),
      });

    } catch (e) {
      console.error('Failed to fetch live sessions', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sessions</h1>
          <p className="text-slate-500 mt-1">Manage tutoring sessions</p>
        </div>
        <button 
          onClick={() => router.push('/schedule')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" />
          Schedule Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: stats.total.toString(), icon: Video, color: 'bg-blue-50 text-blue-600' },
          { label: 'This Week', value: stats.week.toString(), icon: Calendar, color: 'bg-purple-50 text-purple-600' },
          { label: 'Completed', value: stats.completed.toString(), icon: Play, color: 'bg-green-50 text-green-600' },
          { label: 'Hours Taught', value: stats.hours.toString(), icon: Clock, color: 'bg-amber-50 text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Upcoming Sessions</h2>
        {sessions.filter(s => s.status === 'upcoming').map((session) => (
          <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-700">{session.student[0]}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{session.student}</h3>
                  <p className="text-sm text-slate-500">{session.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium text-slate-900">{session.date}</p>
                  <p className="text-sm text-slate-500">{session.time} • {session.duration}</p>
                </div>
                <button 
                  onClick={() => router.push(isTeacher ? `/sessions/studio/room-${session.id}` : `/sessions/live/room-${session.id}`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
                >
                  {isTeacher ? 'Start Session' : 'Join Class'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Past Sessions</h2>
        {sessions.filter(s => s.status === 'completed').map((session) => (
          <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-600">{session.student[0]}</span>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{session.student}</h3>
                  <p className="text-sm text-slate-500">{session.subject} • {session.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Completed</span>
                <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50">
                  <FileText className="w-4 h-4 inline mr-1" />
                  View Notes
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}