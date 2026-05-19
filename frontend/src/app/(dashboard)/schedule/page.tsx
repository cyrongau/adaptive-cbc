'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Video,
  Users,
  BookOpen,
  X,
  CheckCircle
} from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

interface ScheduleItem {
  id: string;
  title: string;
  type: 'class' | 'tutoring' | 'meeting';
  day: number;
  time: string;
  duration: number;
  grade?: number;
  subject?: string;
  students?: number;
}

const MOCK_SCHEDULE: ScheduleItem[] = [
  { id: '1', title: 'Grade 4 Mathematics', type: 'class', day: 1, time: '8:00 AM', duration: 60, grade: 4, subject: 'Mathematics', students: 28 },
  { id: '2', title: 'Grade 6 Science Lab', type: 'class', day: 2, time: '10:00 AM', duration: 90, grade: 6, subject: 'Science', students: 24 },
  { id: '3', title: 'English Tutoring - John', type: 'tutoring', day: 3, time: '2:00 PM', duration: 60, grade: 5 },
  { id: '4', title: 'Staff Meeting', type: 'meeting', day: 4, time: '3:00 PM', duration: 60 },
  { id: '5', title: 'Grade 9 Physics', type: 'class', day: 5, time: '9:00 AM', duration: 60, grade: 9, subject: 'Physics', students: 32 },
];

export default function SchedulePage() {
  const { user } = useAuthStore();
  const [currentWeek, setCurrentWeek] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(MOCK_SCHEDULE);
  const [newSchedule, setNewSchedule] = useState<Omit<ScheduleItem, 'id'>>({ title: '', type: 'class', day: 1, time: '8:00 AM', duration: 60, grade: 4, subject: 'Mathematics' });

  const isTeacher = user?.role === 'teacher' || user?.role === 'tutor' || user?.role === 'super_admin' || user?.role === 'institution_admin';

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'class': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'tutoring': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'meeting': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: ScheduleItem = { ...newSchedule, id: Date.now().toString() };
    setSchedule([...schedule, newItem]);
    toast.success('Schedule added successfully!');
    setShowModal(false);
    setNewSchedule({ title: '', type: 'class', day: 1, time: '8:00 AM', duration: 60, grade: 4, subject: 'Mathematics' });
  };

  const getScheduleForSlot = (day: number, time: string) => {
    return schedule.filter(s => s.day === day && s.time === time);
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + (currentWeek * 7) + i + 1);
    return date;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Schedule</h1>
          <p className="text-slate-500 mt-1">Manage your classes, tutoring sessions, and meetings</p>
        </div>
        {isTeacher && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Add Session
          </button>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentWeek(currentWeek - 1)}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-500" />
          <span className="font-medium text-slate-900">
            Week of {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <button
          onClick={() => setCurrentWeek(currentWeek + 1)}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Schedule Legend */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'Class', color: 'bg-blue-100 text-blue-700 border-blue-200' },
          { label: 'Tutoring', color: 'bg-purple-100 text-purple-700 border-purple-200' },
          { label: 'Meeting', color: 'bg-amber-100 text-amber-700 border-amber-200' },
        ].map((item, i) => (
          <div key={i} className={`px-3 py-1 rounded-lg border text-sm ${item.color}`}>
            {item.label}
          </div>
        ))}
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-8 border-b border-slate-200">
          <div className="p-3 text-sm font-medium text-slate-500 border-r border-slate-200 bg-slate-50">Time</div>
          {DAYS.map((day, i) => (
            <div key={day} className="p-3 text-center border-r border-slate-200 bg-slate-50">
              <p className="text-sm font-medium text-slate-700">{day}</p>
              <p className="text-xs text-slate-500">{weekDates[i].getDate()}</p>
            </div>
          ))}
        </div>
        
        <div className="max-h-[500px] overflow-y-auto">
          {TIMES.map((time) => (
            <div key={time} className="grid grid-cols-8 border-b border-slate-100">
              <div className="p-2 text-xs text-slate-500 border-r border-slate-100 bg-slate-50">{time}</div>
              {DAYS.map((_, dayIndex) => {
                const items = getScheduleForSlot(dayIndex, time);
                return (
                  <div key={dayIndex} className="p-1 border-r border-slate-100 min-h-[60px]">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-2 rounded-lg text-xs border ${getTypeColor(item.type)} mb-1 cursor-pointer hover:shadow-md`}
                      >
                        <p className="font-bold truncate">{item.title}</p>
                        <div className="flex items-center gap-1 mt-1 opacity-75">
                          <Clock className="w-3 h-3" />
                          {item.duration}min
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Today's Classes
          </h3>
          <div className="space-y-3">
            {schedule.filter(s => s.type === 'class').slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.time} • Grade {item.grade}</p>
                </div>
                <span className="text-sm text-blue-600">{item.students} students</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            Upcoming Tutoring
          </h3>
          <div className="space-y-3">
            {schedule.filter(s => s.type === 'tutoring').slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.time}</p>
                </div>
                <button className="text-sm text-purple-600 font-medium">Join</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Add Session</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Session Title</label>
                <input
                  type="text"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  placeholder="e.g., Grade 4 Mathematics"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={newSchedule.type}
                  onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="class">Class</option>
                  <option value="tutoring">Tutoring</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
                  <select
                    value={newSchedule.day}
                    onChange={(e) => setNewSchedule({ ...newSchedule, day: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  >
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <select
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  >
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                  <select
                    value={newSchedule.duration}
                    onChange={(e) => setNewSchedule({ ...newSchedule, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                  <select
                    value={newSchedule.grade}
                    onChange={(e) => setNewSchedule({ ...newSchedule, grade: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  >
                    {[1,2,3,4,5,6,7,8,9].map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <select
                  value={newSchedule.subject}
                  onChange={(e) => setNewSchedule({ ...newSchedule, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                  <option value="Science">Science</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Kiswahili">Kiswahili</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                >
                  Add Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}