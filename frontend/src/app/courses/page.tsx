'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Star,
  ArrowRight,
  BookOpen,
  Clock,
  Users,
  ChevronRight,
  Calculator,
  FlaskConical,
  Globe,
  Target,
  Palette,
  Music,
  Sprout,
  Languages,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';

const SUBJECTS = ['All', 'Mathematics', 'Science', 'Social Studies', 'Kiswahili', 'Creative Arts', 'Agriculture', 'Music'];
const PRICING = ['All', 'Free', 'Paid'];

const subjectIcons: Record<string, React.ElementType> = {
  Mathematics: Calculator,
  Science: FlaskConical,
  'Social Studies': Globe,
  Kiswahili: Languages,
  'Creative Arts': Palette,
  Agriculture: Sprout,
  Music: Music,
};

const subjectGradients: Record<string, string> = {
  Mathematics: 'from-[#006a34]/20 to-[#268549]/10',
  Science: 'from-[#455f88]/20 to-[#a3bcdd]/10',
  'Social Studies': 'from-amber-500/40 to-yellow-300/10',
  Kiswahili: 'from-[#006a34]/20 to-[#268549]/10',
  'Creative Arts': 'from-pink-500/40 to-purple-300/10',
  Agriculture: 'from-emerald-500/40 to-green-300/10',
  Music: 'from-violet-500/40 to-indigo-300/10',
};

const defaultGradient = 'from-slate-400/20 to-slate-300/10';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ subject: 'All', pricing: 'All' });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses/published');
      setCourses(res.data || []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const gradeRange = (grade: number) => {
    if (grade <= 3) return 'Grade 1-3';
    if (grade <= 6) return 'Grade 4-6';
    if (grade <= 9) return 'Grade 7-9';
    return 'Grade 10-12';
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filters.subject === 'All' || course.subject === filters.subject;
    const matchesPricing =
      filters.pricing === 'All' ||
      (filters.pricing === 'Free' && (!course.price || course.price === 0)) ||
      (filters.pricing === 'Paid' && course.price > 0);
    return matchesSearch && matchesSubject && matchesPricing;
  });

  return (
    <div className="min-h-screen bg-surface-low">
      {/* Hero */}
      <div className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #006a34 0%, #1c8445 50%, #0b5327 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 text-white/40" />
            <span className="text-white text-sm font-semibold">Courses</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            CBC Curriculum Courses
          </h1>
          <p className="text-lg text-white/80 max-w-2xl font-semibold">
            Explore our comprehensive library of competency-based courses designed for Grades 1-12.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Subjects' : s}
                  </option>
                ))}
              </select>
              <select
                value={filters.pricing}
                onChange={(e) => setFilters({ ...filters, pricing: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                {PRICING.map((p) => (
                  <option key={p} value={p}>
                    {p === 'All' ? 'All Pricing' : p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            {loading ? (
              'Loading courses...'
            ) : (
              <>
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {filteredCourses.length}
                </span>{' '}
                course{filteredCourses.length !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-[#47a263] animate-spin" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No courses found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ subject: 'All', pricing: 'All' });
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, i) => {
              const SubjectIcon = subjectIcons[course.subject] || BookOpen;
              const gradient = subjectGradients[course.subject] || defaultGradient;
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all"
                >
                  {/* Course Header */}
                  <div
                    className={`h-40 bg-gradient-to-br ${gradient} relative p-6 flex items-center justify-center border-b border-slate-100`}
                  >
                    {(course.featuredImage || course.thumbnail) && (
                      <img
                        src={course.featuredImage || course.thumbnail}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md relative">
                      <SubjectIcon className="w-8 h-8 text-[#006a34]" />
                    </div>
                  </div>

                  {/* Course Body */}
                  <div className="p-6">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider mb-2">
                      <span className="text-[#455f88]">
                        {(course.subject || '').toUpperCase()}
                      </span>
                      <span className="text-[#705d00] flex items-center font-extrabold">
                        <Star className="w-3.5 h-3.5 fill-[#705d00] mr-0.5" />
                        {Number(course.averageRating || 0).toFixed(1)} ({course.totalReviews ?? 0})
                      </span>
                    </div>

                    <h3 className="font-extrabold text-lg text-slate-900 mb-2 leading-tight">
                      {course.title}
                    </h3>

                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4 min-h-[40px]">
                      {(course.description || 'No description').length > 25
                        ? (course.description || 'No description').slice(0, 25) + '...'
                        : course.description || 'No description'}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {course.totalStudents ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {course.totalLessons ?? 0} lessons
                      </span>
                      {course.estimatedDuration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {course.estimatedDuration}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Grade
                        </span>
                        <span className="text-sm font-extrabold text-slate-900 block">
                          {course.grade ? gradeRange(course.grade) : 'N/A'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Price
                        </span>
                        <span className="text-lg font-extrabold text-slate-900 block">
                          {!course.price || course.price === 0 ? (
                            <span className="text-emerald-600">Free</span>
                          ) : (
                            `KSh ${Number(course.price).toLocaleString()}`
                          )}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/courses/${course.id}`}
                      className="group/btn mt-4 w-full flex items-center justify-center gap-2 bg-[#47a263] text-[#003919] font-extrabold text-xs px-5 py-2.5 rounded-lg hover:bg-[#3d8b55] transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95"
                    >
                      View Course <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
