'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';
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
  CheckCircle,
  GraduationCap,
  User,
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

interface Lesson {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: number;
  stream?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isLive: boolean;
  meetingLink?: string;
  status: string;
  teacher?: { id: string; firstName: string; lastName: string };
}

interface TimetableDay {
  day: string;
  lessons: Lesson[];
}

const DAY_MAP: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function findClosestTimeSlot(timeMinutes: number): string {
  const slots = TIMES.map(t => {
    const [h, m] = t.replace(' AM', '').replace(' PM', '').split(':').map(Number);
    const isPM = t.includes('PM');
    const hour24 = isPM && h !== 12 ? h + 12 : !isPM && h === 12 ? 0 : h;
    return { label: t, minutes: hour24 * 60 + (m || 0) };
  });

  let closest = slots[0];
  let minDiff = Math.abs(timeMinutes - slots[0].minutes);
  for (const slot of slots) {
    const diff = Math.abs(timeMinutes - slot.minutes);
    if (diff < minDiff) {
      minDiff = diff;
      closest = slot;
    }
  }
  return closest.label;
}

export default function SchedulePage() {
  const { user } = useAuthStore();
  const [currentWeek, setCurrentWeek] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSchedule, setNewSchedule] = useState<Omit<ScheduleItem, 'id'>>({ title: '', type: 'class', day: 1, time: '8:00 AM', duration: 60, grade: 4, subject: 'Mathematics' });
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const canManage = user?.role === 'teacher' || user?.role === 'tutor' || user?.role === 'super_admin' || user?.role === 'institution_admin';

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lessons/timetable');
      const timetable: TimetableDay[] = res.data?.timetable || [];

      const items: ScheduleItem[] = [];
      for (const day of timetable) {
        const dayIndex = DAY_MAP[day.day.toLowerCase()];
        if (dayIndex === undefined) continue;
        for (const lesson of day.lessons) {
          const startMinutes = timeToMinutes(lesson.startTime);
          const endMinutes = timeToMinutes(lesson.endTime);
          const duration = endMinutes - startMinutes;
          const timeLabel = minutesToTimeStr(startMinutes);
          items.push({
            id: lesson.id,
            title: lesson.title,
            type: 'class',
            day: dayIndex,
            time: findClosestTimeSlot(startMinutes),
            duration: duration > 0 ? duration : 60,
            grade: lesson.grade,
            subject: lesson.subject,
          });
        }
      }
      setSchedule(items);
    } catch {
      console.error('Failed to fetch timetable');
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-slate-500 mt-1">View your weekly schedule and sessions</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Add Session
          </button>
        )}
      </div>

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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
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
                          onClick={() => setSelectedItem(item)}
                          className={`p-2 rounded-lg text-xs border ${getTypeColor(item.type)} mb-1 cursor-pointer hover:shadow-md transition-shadow`}
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
      )}

      {schedule.length > 0 && (
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
                  <span className="text-sm text-blue-600">{item.students || 0} students</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-600" />
              Upcoming
            </h3>
            <div className="space-y-3">
              {schedule.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${getTypeColor(selectedItem.type)}`}>
                  {selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedItem.title}</h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{DAYS[selectedItem.day]}, {selectedItem.time}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{selectedItem.duration} minutes</span>
                </div>
                {selectedItem.subject && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>{selectedItem.subject}</span>
                  </div>
                )}
                {selectedItem.grade && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>Grade {selectedItem.grade}</span>
                  </div>
                )}
                {selectedItem.students !== undefined && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{selectedItem.students} students</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                >
                  Close
                </button>
                {selectedItem.type === 'class' && (
                  <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
                    View Details
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
