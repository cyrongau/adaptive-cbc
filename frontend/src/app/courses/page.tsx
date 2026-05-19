'use client';

import React, { useState } from 'react';
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
  Compass,
  Palette,
  Music,
  Sprout,
  Languages,
} from 'lucide-react';

const SUBJECTS = ['All', 'Mathematics', 'Science', 'Social Studies', 'Kiswahili', 'Creative Arts', 'Agriculture', 'Music'];
const GRADES = ['All', 'Grade 1-3', 'Grade 4-6', 'Grade 7-9', 'Grade 10-12'];
const PRICING = ['All', 'Free', 'Paid'];

interface Course {
  id: number;
  title: string;
  subject: string;
  description: string;
  price: number;
  rating: number;
  reviews: string;
  students: string;
  lessons: number;
  duration: string;
  grade: string;
  imageGradient: string;
  icon: React.ElementType;
  featured: boolean;
}

const ALL_COURSES: Course[] = [
  { id: 1, title: 'Grade 4 Math Mastery', subject: 'Mathematics', description: 'Master fractions, decimals, and basic algebra through interactive stories and puzzles.', price: 1200, rating: 4.8, reviews: '2.4K', students: '5.2K', lessons: 48, duration: '24h', grade: 'Grade 4-6', imageGradient: 'from-[#006a34]/20 to-[#268549]/10', icon: Calculator, featured: true },
  { id: 2, title: 'Science Explorers', subject: 'Science', description: 'Explore the human body, plants, and environmental conservation in high detail.', price: 950, rating: 4.9, reviews: '1.8K', students: '3.8K', lessons: 36, duration: '18h', grade: 'Grade 4-6', imageGradient: 'from-[#455f88]/20 to-[#a3bcdd]/10', icon: FlaskConical, featured: true },
  { id: 3, title: 'Our Heritage & Resources', subject: 'Social Studies', description: "A deep dive into Kenya's rich history, geography, and civic duties for Grade 6.", price: 1100, rating: 4.6, reviews: '1.5K', students: '2.9K', lessons: 42, duration: '21h', grade: 'Grade 4-6', imageGradient: 'from-amber-500/40 to-yellow-300/10', icon: Globe, featured: true },
  { id: 4, title: 'Grade 7 Algebra Foundations', subject: 'Mathematics', description: 'Build strong algebraic thinking with variables, expressions, and linear equations.', price: 1500, rating: 4.7, reviews: '980', students: '2.1K', lessons: 52, duration: '26h', grade: 'Grade 7-9', imageGradient: 'from-[#006a34]/20 to-[#268549]/10', icon: Calculator, featured: false },
  { id: 5, title: 'Physics for Beginners', subject: 'Science', description: 'Understand motion, forces, energy, and waves through hands-on experiments.', price: 1350, rating: 4.8, reviews: '1.2K', students: '3.1K', lessons: 44, duration: '22h', grade: 'Grade 7-9', imageGradient: 'from-[#455f88]/20 to-[#a3bcdd]/10', icon: Target, featured: false },
  { id: 6, title: 'Kiswahili Fasihi', subject: 'Kiswahili', description: 'Master Swahili literature, grammar, and composition for CBC assessments.', price: 800, rating: 4.5, reviews: '750', students: '1.8K', lessons: 30, duration: '15h', grade: 'Grade 7-9', imageGradient: 'from-[#006a34]/20 to-[#268549]/10', icon: Languages, featured: false },
  { id: 7, title: 'Creative Arts & Design', subject: 'Creative Arts', description: 'Explore drawing, painting, sculpture, and digital design fundamentals.', price: 0, rating: 4.4, reviews: '620', students: '1.5K', lessons: 24, duration: '12h', grade: 'Grade 1-3', imageGradient: 'from-pink-500/40 to-purple-300/10', icon: Palette, featured: false },
  { id: 8, title: 'Music & Performance', subject: 'Music', description: 'Learn rhythm, melody, instruments, and Kenyan folk songs.', price: 0, rating: 4.3, reviews: '480', students: '1.2K', lessons: 20, duration: '10h', grade: 'Grade 1-3', imageGradient: 'from-violet-500/40 to-indigo-300/10', icon: Music, featured: false },
  { id: 9, title: 'Agriculture Basics', subject: 'Agriculture', description: 'Soil preparation, crop farming, animal husbandry, and sustainability.', price: 700, rating: 4.6, reviews: '540', students: '1.4K', lessons: 28, duration: '14h', grade: 'Grade 4-6', imageGradient: 'from-emerald-500/40 to-green-300/10', icon: Sprout, featured: false },
  { id: 10, title: 'Grade 10 Chemistry', subject: 'Science', description: 'Atomic structure, periodic table, chemical bonding, and reactions.', price: 1600, rating: 4.9, reviews: '1.1K', students: '2.8K', lessons: 56, duration: '28h', grade: 'Grade 10-12', imageGradient: 'from-[#455f88]/20 to-[#a3bcdd]/10', icon: FlaskConical, featured: true },
  { id: 11, title: 'Advanced Calculus', subject: 'Mathematics', description: 'Limits, derivatives, integrals, and applications for senior secondary.', price: 1800, rating: 4.7, reviews: '890', students: '1.9K', lessons: 60, duration: '30h', grade: 'Grade 10-12', imageGradient: 'from-[#006a34]/20 to-[#268549]/10', icon: Calculator, featured: false },
  { id: 12, title: 'Geography & Environment', subject: 'Social Studies', description: 'Climate, vegetation, population, and resource management in Kenya.', price: 1000, rating: 4.5, reviews: '670', students: '1.6K', lessons: 38, duration: '19h', grade: 'Grade 10-12', imageGradient: 'from-amber-500/40 to-yellow-300/10', icon: Compass, featured: false },
];

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ subject: 'All', grade: 'All', pricing: 'All' });

  const filteredCourses = ALL_COURSES.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filters.subject === 'All' || course.subject === filters.subject;
    const matchesGrade = filters.grade === 'All' || course.grade === filters.grade;
    const matchesPricing = filters.pricing === 'All' || 
      (filters.pricing === 'Free' && course.price === 0) ||
      (filters.pricing === 'Paid' && course.price > 0);
    return matchesSearch && matchesSubject && matchesGrade && matchesPricing;
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
                {SUBJECTS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
              </select>
              <select
                value={filters.grade}
                onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                {GRADES.map(g => <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>)}
              </select>
              <select
                value={filters.pricing}
                onChange={(e) => setFilters({ ...filters, pricing: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                {PRICING.map(p => <option key={p} value={p}>{p === 'All' ? 'All Pricing' : p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{filteredCourses.length}</span> course{filteredCourses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No courses found matching your criteria.</p>
            <button
              onClick={() => { setSearchTerm(''); setFilters({ subject: 'All', grade: 'All', pricing: 'All' }); }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all"
              >
                {/* Course Header */}
                <div className={`h-40 bg-gradient-to-br ${course.imageGradient} relative p-6 flex items-center justify-center border-b border-slate-100`}>
                  {course.featured && (
                    <span className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                      Featured
                    </span>
                  )}
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md">
                    <course.icon className="w-8 h-8 text-[#006a34]" />
                  </div>
                </div>

                {/* Course Body */}
                <div className="p-6">
                  <div className="flex items-center justify-between text-[11px] font-bold tracking-wider mb-2">
                    <span className="text-[#455f88]">{course.subject.toUpperCase()}</span>
                    <span className="text-[#705d00] flex items-center font-extrabold">
                      <Star className="w-3.5 h-3.5 fill-[#705d00] mr-0.5" />
                      {course.rating} ({course.reviews})
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg text-slate-900 mb-2 leading-tight">
                    {course.title}
                  </h3>
                  
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4 min-h-[40px]">
                    {course.description}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {course.students}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {course.lessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {course.duration}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Price</span>
                      <span className="text-lg font-extrabold text-slate-900 block">
                        {course.price === 0 ? (
                          <span className="text-emerald-600">Free</span>
                        ) : (
                          `KSh ${course.price.toLocaleString()}`
                        )}
                      </span>
                    </div>
                    
                    <Link 
                      href={`/courses/${course.id}`} 
                      className="group/btn bg-[#47a263] text-[#003919] font-extrabold text-xs px-5 py-2.5 rounded-lg hover:bg-[#3d8b55] transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-95 flex items-center gap-1"
                    >
                      Enroll Now <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
