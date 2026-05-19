'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  Users, 
  BookOpen, 
  Play, 
  CheckCircle, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Share2, 
  Heart,
  Calculator,
  FlaskConical,
  Globe,
  Target,
  Compass,
  Palette,
  Music,
  Sprout,
  Languages,
  FileText,
  Headphones,
  Video,
  Download,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const COURSE_DATA: Record<number, any> = {
  1: {
    id: 1,
    title: 'Grade 4 Math Mastery',
    subject: 'Mathematics',
    description: 'Master fractions, decimals, and basic algebra through interactive stories and puzzles. This comprehensive course covers all CBC Grade 4 mathematics competencies with engaging lessons, practice exercises, and assessments.',
    price: 1200,
    rating: 4.8,
    reviews: '2.4K',
    students: '5.2K',
    lessons: 48,
    duration: '24h',
    grade: 'Grade 4-6',
    imageGradient: 'from-[#006a34]/20 to-[#268549]/10',
    icon: Calculator,
    featured: true,
    featuredVideo: 'https://www.youtube.com/embed/dQw4W9WgXcQ',
    instructor: { name: 'Mr. James Omondi', title: 'Senior Mathematics Educator', avatar: 'JO', experience: '12 years' },
    whatYouLearn: [
      'Understand and work with fractions, decimals, and percentages',
      'Solve basic algebraic expressions and equations',
      'Apply geometry concepts to real-world problems',
      'Master measurement and data interpretation',
      'Develop problem-solving and critical thinking skills',
      'Prepare for CBC Grade 4 mathematics assessments',
    ],
    curriculum: [
      {
        title: 'Module 1: Number Sense & Operations',
        lessons: [
          { title: 'Understanding Place Value (up to 10,000)', duration: '25 min', free: true, type: 'video' },
          { title: 'Addition & Subtraction with Regrouping', duration: '30 min', free: true, type: 'video' },
          { title: 'Multiplication Facts (up to 12×12)', duration: '35 min', free: false, type: 'video' },
          { title: 'Division with Remainders', duration: '30 min', free: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Fractions & Decimals',
        lessons: [
          { title: 'Introduction to Fractions', duration: '25 min', free: false, type: 'video' },
          { title: 'Equivalent Fractions', duration: '30 min', free: false, type: 'video' },
          { title: 'Adding & Subtracting Fractions', duration: '35 min', free: false, type: 'video' },
          { title: 'Understanding Decimals', duration: '25 min', free: false, type: 'audio' },
          { title: 'Converting Fractions to Decimals', duration: '30 min', free: false, type: 'video' },
        ],
      },
      {
        title: 'Module 3: Geometry & Measurement',
        lessons: [
          { title: '2D Shapes & Properties', duration: '25 min', free: false, type: 'video' },
          { title: 'Perimeter & Area', duration: '35 min', free: false, type: 'video' },
          { title: 'Understanding Angles', duration: '25 min', free: false, type: 'audio' },
          { title: 'Time & Money Problems', duration: '30 min', free: false, type: 'video' },
        ],
      },
      {
        title: 'Module 4: Data & Algebra',
        lessons: [
          { title: 'Reading & Creating Graphs', duration: '25 min', free: false, type: 'video' },
          { title: 'Introduction to Patterns', duration: '30 min', free: false, type: 'video' },
          { title: 'Simple Equations', duration: '35 min', free: false, type: 'video' },
          { title: 'Problem Solving Strategies', duration: '30 min', free: false, type: 'video' },
        ],
      },
    ],
    learningMaterials: [
      { title: 'Grade 4 Math Formula Sheet', type: 'pdf', size: '2.4 MB', url: '#' },
      { title: 'Practice Workbook - Term 1', type: 'pdf', size: '5.1 MB', url: '#' },
      { title: 'Mental Math Audio Drills', type: 'audio', size: '18 MB', url: '#' },
      { title: 'Geometry Visual Guide', type: 'pdf', size: '3.8 MB', url: '#' },
      { title: 'Fraction Manipulatives Video', type: 'video', size: '45 MB', url: '#' },
    ],
    testimonials: [
      { name: 'Grace W.', role: 'Parent', content: 'My son went from struggling with fractions to scoring top marks. The interactive lessons make math fun!', rating: 5 },
      { name: 'Peter K.', role: 'Grade 4 Student', content: 'I love the puzzles and stories. Math is no longer boring!', rating: 5 },
      { name: 'Mrs. Akinyi', role: 'Teacher', content: 'I use this as supplementary material for my class. Excellent alignment with CBC curriculum.', rating: 4 },
    ],
  },
};

export default function CourseDetailsPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const courseId = parseInt(params.id as string);
  const course = COURSE_DATA[courseId] || COURSE_DATA[1];
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({ 0: true });
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const toggleModule = (index: number) => {
    setOpenModules(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const totalLessons = course.curriculum.reduce((acc: number, m: any) => acc + m.lessons.length, 0);
  const freeLessons = course.curriculum.reduce((acc: number, m: any) => acc + m.lessons.filter((l: any) => l.free).length, 0);

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please log in to enroll in this course');
      return;
    }
    if (user.role !== 'student') {
      toast.error('Only students can enroll in courses');
      return;
    }
    setIsEnrolling(true);
    try {
      await api.post('/enrollment', {
        courseId: course.title.toLowerCase().replace(/\s+/g, '-'),
        courseTitle: course.title,
        amountPaid: course.price,
      });
      toast.success('Successfully enrolled in ' + course.title);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to enroll. Please try again.';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsEnrolling(false);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      default: return <Play className="w-4 h-4" />;
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'audio': return <Headphones className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getMaterialColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'text-red-500 bg-red-50';
      case 'audio': return 'text-purple-500 bg-purple-50';
      case 'video': return 'text-blue-500 bg-blue-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  return (
    <div className="min-h-screen bg-surface-low">
      {/* Course Hero */}
      <div className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #006a34 0%, #1c8445 50%, #0b5327 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <Link href="/courses" className="inline-flex items-center gap-2 text-white/60 text-sm hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </Link>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full">{course.subject}</span>
                {course.featured && <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider rounded-full">Featured</span>}
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-4">
                {course.title}
              </h1>
              <p className="text-lg text-white/80 font-semibold mb-6">
                {course.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {course.rating} ({course.reviews} reviews)</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.students} students</span>
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {totalLessons} lessons</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration} total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">What You'll Learn</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {course.whatYouLearn.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#47a263] shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-slate-900">Course Curriculum</h2>
                <span className="text-sm text-slate-500">{course.curriculum.length} modules • {totalLessons} lessons</span>
              </div>
              <div className="space-y-3">
                {course.curriculum.map((module: any, moduleIndex: number) => (
                  <div key={moduleIndex} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleModule(moduleIndex)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-[#006a34]/10 text-[#006a34] font-bold text-sm flex items-center justify-center">{moduleIndex + 1}</span>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-slate-900">{module.title}</p>
                          <p className="text-xs text-slate-500">{module.lessons.length} lessons • {module.lessons.reduce((acc: number, l: any) => acc + parseInt(l.duration), 0)} min</p>
                        </div>
                      </div>
                      {openModules[moduleIndex] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    {openModules[moduleIndex] && (
                      <div className="divide-y divide-slate-100">
                        {module.lessons.map((lesson: any, lessonIndex: number) => (
                          <div key={lessonIndex} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              {lesson.free ? (
                                <Play className="w-5 h-5 text-[#47a263]" />
                              ) : (
                                <Lock className="w-5 h-5 text-slate-300" />
                              )}
                              <div>
                                <p className={`text-sm ${lesson.free ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{lesson.title}</p>
                                {lesson.free && <span className="text-[10px] text-[#47a263] font-bold uppercase">Free Preview</span>}
                              </div>
                            </div>
                            <span className="text-xs text-slate-400">{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">Your Instructor</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#006a34]/10 flex items-center justify-center text-[#006a34] font-bold text-lg">{course.instructor.avatar}</div>
                <div>
                  <h3 className="font-bold text-slate-900">{course.instructor.name}</h3>
                  <p className="text-sm text-slate-500">{course.instructor.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{course.instructor.experience} teaching experience</p>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">Student Reviews</h2>
              <div className="space-y-4">
                {course.testimonials.map((review: any, i: number) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} className={`w-4 h-4 ${starIndex < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{review.content}</p>
                    <p className="text-xs font-semibold text-slate-900">{review.name} <span className="text-slate-400 font-normal">• {review.role}</span></p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Video */}
            {course.featuredVideo && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="aspect-video relative">
                  <iframe
                    src={course.featuredVideo}
                    title="Course Preview"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Preview</p>
                </div>
              </div>
            )}

            {/* Price Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <div className="text-center mb-6">
                <span className="text-3xl font-extrabold text-slate-900">
                  {course.price === 0 ? 'Free' : `KSh ${course.price.toLocaleString()}`}
                </span>
                {course.price > 0 && <p className="text-xs text-slate-400 mt-1">One-time payment • Lifetime access</p>}
              </div>

              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="group/enroll block w-full py-3 bg-[#47a263] text-[#003919] font-extrabold text-sm rounded-xl text-center hover:bg-[#3d8b55] transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm flex items-center justify-center gap-2"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    Enroll Now
                    <motion.span
                      className="inline-block"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      →
                    </motion.span>
                  </>
                )}
              </button>

              {!user && (
                <p className="text-xs text-center text-slate-400 mt-2">
                  <Link href="/login" className="text-[#47a263] hover:underline">Log in</Link> to enroll
                </p>
              )}
              {user && user.role !== 'student' && (
                <p className="text-xs text-center text-amber-600 mt-2">
                  Only students can enroll in courses
                </p>
              )}

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`flex-1 py-2.5 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${isWishlisted ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500' : ''}`} /> Wishlist
                </button>
                <button className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
              <div className="space-y-3 mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Lessons</span>
                  <span className="font-semibold text-slate-900">{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Duration</span>
                  <span className="font-semibold text-slate-900">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><Play className="w-4 h-4" /> Free Previews</span>
                  <span className="font-semibold text-slate-900">{freeLessons}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><Users className="w-4 h-4" /> Students</span>
                  <span className="font-semibold text-slate-900">{course.students}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><Award className="w-4 h-4" /> Certificate</span>
                  <span className="font-semibold text-slate-900">Yes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Materials Section */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-extrabold text-slate-900 mb-4">Learning Materials</h2>
          <p className="text-sm text-slate-500 mb-6">Downloadable resources included with this course. Available after enrollment.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.learningMaterials.map((material: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-100 transition-all group">
                <div className={`w-10 h-10 rounded-lg ${getMaterialColor(material.type)} flex items-center justify-center shrink-0`}>
                  {getMaterialIcon(material.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{material.title}</p>
                  <p className="text-xs text-slate-400">{material.type.toUpperCase()} • {material.size}</p>
                </div>
                <button className="p-2 text-slate-400 hover:text-[#47a263] transition-colors opacity-0 group-hover:opacity-100">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
