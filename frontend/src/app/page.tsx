'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import NotificationBell from '@/components/NotificationBell';
import { 
  BookOpen, Brain, Trophy, Users, BarChart3, GraduationCap, 
  ArrowRight, Star, CheckCircle, Search, Play, Clock, Award,
  ChevronRight, BookMarked, TrendingUp, Target, Sparkles,
  FileText, Globe, Scissors, Milestone, User, HelpCircle,
  Video, Compass, ShieldAlert, Check, Building2
} from 'lucide-react';

const modernLearningFeatures = [
  {
    icon: Brain,
    title: 'AI-Adaptive Practice',
    description: 'Quizzes that evolve with your progress, focusing on areas that need improvement.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: FileText,
    title: 'OCR Digitization',
    description: 'Snap a photo of your handwritten homework and convert it into interactive digital lessons.',
    color: 'text-secondary bg-secondary/10',
  },
  {
    icon: Users,
    title: 'Tutor Marketplace',
    description: 'Connect with certified CBC educators for personalized 1-on-1 video sessions.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: Trophy,
    title: 'Gamified Learning',
    description: 'Earn badges and compete on leaderboards while mastering new competencies.',
    color: 'text-secondary bg-secondary/10',
  },
];

const featuredCourses = [
  {
    id: 1,
    title: 'Grade 4 Math Mastery',
    subject: 'MATHEMATICS',
    description: 'Master fractions, decimals, and basic algebra through interactive stories and puzzles.',
    price: 1200,
    rating: 4.8,
    reviews: '2.4K',
    imageGradient: 'from-[#006a34]/20 to-[#268549]/10',
    icon: Target,
  },
  {
    id: 2,
    title: 'Science Explorers',
    subject: 'SCIENCE',
    description: 'Explore the human body, plants, and environmental conservation in high...',
    price: 950,
    rating: 4.9,
    reviews: '1.8K',
    imageGradient: 'from-[#455f88]/20 to-[#a3bcdd]/10',
    icon: Compass,
  },
  {
    id: 3,
    title: 'Our Heritage & Resources',
    subject: 'SOCIAL STUDIES',
    description: "A deep dive into Kenya's rich history, geography, and civic duties for Grade 6.",
    price: 1100,
    rating: 4.6,
    reviews: '1.5K',
    imageGradient: 'from-amber-500/40 to-yellow-300/10',
    icon: Globe,
  },
];

const subjectCards = [
  { name: 'Math', icon: 'Σ', color: 'text-primary bg-[#006a34]/5 border-[#006a34]/10' },
  { name: 'Science', icon: '🔬', color: 'text-[#455f88] bg-[#455f88]/5 border-[#455f88]/10' },
  { name: 'Social Studies', icon: '🌍', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { name: 'Kiswahili', icon: 'A/文', color: 'text-primary bg-[#006a34]/5 border-[#006a34]/10' },
  { name: 'Agriculture', icon: '🚜', color: 'text-[#455f88] bg-[#455f88]/5 border-[#455f88]/10' },
  { name: 'Art & Craft', icon: '🎨', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
];

const steps = [
  {
    number: '1',
    title: 'Register',
    description: 'Create your profile and select your current Grade level in the CBC curriculum.',
  },
  {
    number: '2',
    title: 'Set Goals',
    description: "Define what competencies you want to master this term with Adaptive CBC's AI guidance.",
  },
  {
    number: '3',
    title: 'Start Learning',
    description: 'Engage with adaptive practice, watch videos, and track your progress in real-time.',
  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Grade 7 Student',
    content: 'Adaptive CBC AI has completely changed how I do my homework. I no longer feel stressed about the CBC requirements. The explanations are extremely clear!',
    image: 'S',
    rating: 5,
  },
  {
    name: 'David M.',
    role: 'Parent of Grade 5 Student',
    content: 'The progress reports are actually useful! I see where my child is struggling, and the practice recommendations are spot-on.',
    image: 'D',
    rating: 5,
  },
  {
    name: 'Mrs. Alividza',
    role: 'CBC Educator',
    content: 'As a teacher, I recommend Adaptive CBC to all my students. It helps me understand where each student needs help and automates question generation.',
    image: 'A',
    rating: 5,
  },
];

const mockSearchDatabase = [
  // Subjects
  { type: 'Subject', name: 'Mathematics', link: '#subjects' },
  { type: 'Subject', name: 'Science & Technology', link: '#subjects' },
  { type: 'Subject', name: 'Social Studies', link: '#subjects' },
  { type: 'Subject', name: 'Kiswahili Lugha', link: '#subjects' },
  { type: 'Subject', name: 'Agriculture & Nutrition', link: '#subjects' },
  { type: 'Subject', name: 'Creative Arts', link: '#subjects' },
  
  // Tutors
  { type: 'Tutor', name: 'Dr. Kiprop (Science Expert)', link: '#tutors' },
  { type: 'Tutor', name: 'Mrs. Alividza (Kiswahili Guru)', link: '#tutors' },
  { type: 'Tutor', name: 'Mr. Mwangi (Mathematics Wizard)', link: '#tutors' },
  { type: 'Tutor', name: 'Sister Nanjala (English Specialist)', link: '#tutors' },

  // Books
  { type: 'Book', name: 'Grade 4 Science Pathfinder Companion', link: '#' },
  { type: 'Book', name: 'CBC Mathematics Workbook Grade 5', link: '#' },
  { type: 'Book', name: "Our Heritage & Social Studies Pupil's Book", link: '#' },
  { type: 'Book', name: 'Simplified Agriculture for Grade 6', link: '#' },

  // Past Papers & Exams
  { type: 'Past Paper', name: 'Grade 4 CBC Science National Assessment 2024', link: '#' },
  { type: 'Past Paper', name: 'KPSEA Mathematics Practice Exam 2023', link: '#' },
  { type: 'Past Paper', name: 'Grade 6 Social Studies End-Term Assessment', link: '#' },
  { type: 'Past Paper', name: 'Kiswahili Insha na Lugha Trial Paper', link: '#' },

  // Questions
  { type: 'Question', name: 'What are the three states of matter?', link: '#' },
  { type: 'Question', name: 'Explain the key stages of soil erosion.', link: '#' },
  { type: 'Question', name: 'Find the greatest common divisor (GCD) of 24 and 36.', link: '#' },
  { type: 'Question', name: 'What is the role of a parent in Grade 5 homework projects?', link: '#' }
];

const quickSuggestions = [
  { name: 'Grade 4 Science Mastery', desc: 'Curriculum-aligned practice & quizzes', icon: '🔬' },
  { name: 'Dr. Kiprop (Science Expert)', desc: '1-on-1 personalized tutoring expert', icon: '👨‍🏫' },
  { name: 'KPSEA Mock Exams 2024', desc: 'Mock assessment revision past papers', icon: '📝' },
  { name: 'CBC Mathematics Workbook', desc: 'Full textbook guide for Grade 5', icon: '📖' }
];

export default function HomePage() {
  const { user, logout, initialize, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileDropdown(false);
    toast.success('Logged out successfully');
  };

  const fetchSearchResults = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (!token) {
      const q = query.toLowerCase();
      const filtered = mockSearchDatabase.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.type.toLowerCase().includes(q)
      );
      setSearchResults(filtered);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/v1/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const combined: any[] = [];
        if (data.questions) combined.push(...data.questions.map((q: any) => ({ type: 'Question', name: q.title, link: '#', meta: q })));
        if (data.subjects) combined.push(...data.subjects.map((s: any) => ({ type: 'Subject', name: s.title, link: '#', meta: s })));
        if (data.topics) combined.push(...data.topics.map((t: any) => ({ type: 'Topic', name: t.title, link: '#', meta: t })));
        if (data.materials) combined.push(...data.materials.map((m: any) => ({ type: 'Material', name: m.title, link: '#', meta: m })));
        if (data.tutors) combined.push(...data.tutors.map((t: any) => ({ type: 'Tutor', name: t.title, link: '#', meta: t })));
        if (data.schools) combined.push(...data.schools.map((s: any) => ({ type: 'School', name: s.title, link: '#', meta: s })));
        setSearchResults(combined);
      } else {
        const q = query.toLowerCase();
        setSearchResults(mockSearchDatabase.filter(item => item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)));
      }
    } catch {
      const q = query.toLowerCase();
      setSearchResults(mockSearchDatabase.filter(item => item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)));
    } finally {
      setSearchLoading(false);
    }
  };

  const triggerSearch = (val: string) => {
    setSearchQuery(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => fetchSearchResults(val), 300);
    setSearchTimeout(timeout);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-surface-low text-gray-900 selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-outline/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/logo.svg" alt="Adaptive CBC" className="h-9 w-auto" />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Adaptive<span className="text-primary">CBC</span>
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-primary font-medium transition-colors border-b-2 border-primary pb-1">Home</a>
            <a href="#courses" className="text-gray-500 hover:text-primary font-medium transition-colors pb-1 border-b-2 border-transparent">Courses</a>
            <Link href="/library" className="text-gray-500 hover:text-primary font-medium transition-colors pb-1 border-b-2 border-transparent">Library</Link>
            <Link href="/store" className="text-gray-500 hover:text-primary font-medium transition-colors pb-1 border-b-2 border-transparent">Marketplace</Link>
            <a href="#practice" className="text-gray-500 hover:text-primary font-medium transition-colors pb-1 border-b-2 border-transparent">Practice</a>
          </div>

          {/* Right Header items */}
          <div className="flex items-center space-x-4">
            {mounted && user ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* Profile Avatar & Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowProfileDropdown(!showProfileDropdown);
                    }}
                    className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm cursor-pointer hover:bg-primary/20 transition-all"
                  >
                    <User className="w-5 h-5 text-primary" />
                  </button>

                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-outline/10 py-2.5 z-50 animate-fade-in text-left">
                      <div className="px-4 py-2 border-b border-gray-50 mb-1.5">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5 uppercase tracking-wider">
                          {user.role} {user.grade ? `• ${user.grade}` : ''}
                        </p>
                      </div>
                      <Link
                        href={user.role === 'super_admin' || (user.role === 'institution_admin' && user.kycStatus === 'approved') ? '/admin/dashboard' : '/dashboard'}
                        onClick={() => setShowProfileDropdown(false)}
                        className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                      >
                        {user.role === 'super_admin' ? 'Admin Dashboard' : user.role === 'institution_admin' ? 'Institution Dashboard' : user.role === 'parent' ? 'Parent Dashboard' : user.role === 'teacher' ? 'Teacher Dashboard' : user.role === 'tutor' ? 'Tutor Dashboard' : 'Dashboard'}
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileDropdown(false)}
                        className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                      >
                        Account Settings
                      </Link>
                      <div className="border-t border-gray-50 mt-1.5 pt-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/login" 
                  className="text-xs text-gray-600 hover:text-primary font-extrabold uppercase tracking-wider px-3 py-2 transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  href="/register" 
                  className="bg-primary text-white text-xs font-extrabold uppercase tracking-wider px-5 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 gradient-hero overflow-visible">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left */}
          <div className="lg:col-span-7 flex flex-col items-start text-left animate-fade-in stagger-1">
            <div className="inline-flex items-center px-3.5 py-1.5 bg-primary/10 rounded-full text-primary font-bold text-xs uppercase tracking-wider mb-6">
              2024 CBC Optional
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-6">
              Learn Smarter with <br />
              <span className="text-primary font-extrabold relative inline-block">
                Adaptive CBC AI
              </span>
            </h1>

            <p className="text-lg text-gray-600 font-medium leading-relaxed mb-8 max-w-xl">
              Adaptive learning for the Kenyan CBC curriculum. Personalized paths for Grade 1 to 9 students to master every competency.
            </p>

            {/* Interactive Search Bar inside Hero */}
            <div className="w-full max-w-2xl relative mb-4 z-40">
              <form onSubmit={handleSearch} className="bg-white rounded-full shadow-lg border border-outline/10 p-2.5 flex items-center focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="flex-1 flex items-center pl-4 pr-2">
                  <Search className="w-5 h-5 text-gray-400 shrink-0 mr-3" />
                  <input 
                    type="text" 
                    placeholder="Search test papers, books, subjects, tutors..."
                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 font-semibold text-sm md:text-base"
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    onChange={(e) => triggerSearch(e.target.value)}
                  />
                </div>
                
                {/* Embedded action icons inside input */}
                <div className="hidden sm:flex items-center space-x-3 text-gray-400 border-l border-gray-100 px-4 mr-2 shrink-0">
                  <button type="button" title="Download" className="hover:text-primary transition-colors">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button type="button" title="Scan Assignment (OCR)" className="hover:text-primary transition-colors">
                    <Sparkles className="w-4 h-4 text-secondary" />
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="bg-primary text-white text-xs md:text-sm font-bold px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md active:scale-95 flex items-center shrink-0"
                >
                  <Search className="w-4 h-4 mr-1.5" />
                  Search
                </button>
              </form>

              {/* Dynamic search results popup */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-outline/10 py-3 z-50 animate-fade-in max-h-80 overflow-y-auto">
                  {!searchQuery.trim() ? (
                    <>
                      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-outline/5 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Adaptive CBC Suggestions</span>
                      </div>
                      <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {quickSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => triggerSearch(item.name)}
                            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-sm shrink-0">
                              {item.icon}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-800">{item.name}</div>
                              <div className="text-[10px] text-gray-400 font-semibold">{item.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : searchLoading ? (
                    <div className="px-6 py-10 text-center">
                      <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs font-bold text-gray-500">Searching across all content...</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-outline/5 flex justify-between items-center">
                        <span>Search Results ({searchResults.length})</span>
                        {searchResults.length > 0 && (
                          <span className="text-[10px] text-primary font-bold normal-case">Live Results</span>
                        )}
                      </div>
                      {searchResults.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                          {searchResults.map((item, idx) => (
                            <Link 
                              key={idx} 
                              href={item.link}
                              onClick={() => {
                                setSearchQuery(item.name);
                                setIsSearchFocused(false);
                              }}
                              className="flex items-center justify-between px-5 py-3.5 hover:bg-primary/5 transition-colors text-sm font-semibold text-gray-700"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center text-xs shrink-0 text-gray-400">
                                  {item.type === 'Subject' ? '📚' : item.type === 'Tutor' ? '👨‍🏫' : item.type === 'Book' ? '📖' : item.type === 'Past Paper' ? '📝' : item.type === 'Question' ? '❓' : item.type === 'Topic' ? '🏷️' : item.type === 'Material' ? '📄' : item.type === 'School' ? '🏫' : '🔍'}
                                </div>
                                <span>{item.name}</span>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-extrabold font-mono shrink-0">
                                {item.type}
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="px-6 py-8 text-center text-gray-400">
                          <HelpCircle className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-xs font-bold">No exact matches found for "{searchQuery}"</p>
                          <p className="text-[10px] text-gray-400 mt-1">Try searching for 'Science', 'Math', 'Tutor', or 'KPSEA'.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* POPULAR links */}
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-bold text-gray-400 mt-2">
              <span className="uppercase tracking-wider">Popular:</span>
              <button onClick={() => triggerSearch('Science')} className="text-primary hover:underline font-semibold transition-colors">Grade 4 Science</button>
              <span>•</span>
              <button onClick={() => triggerSearch('Kiswahili')} className="text-primary hover:underline font-semibold transition-colors">Kiswahili</button>
              <span>•</span>
              <button onClick={() => triggerSearch('Agriculture')} className="text-primary hover:underline font-semibold transition-colors">Agriculture</button>
            </div>
          </div>

          {/* Hero Right - Photo Illustration and Floating Badge */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end animate-fade-in stagger-2">
            <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-[24px] overflow-hidden shadow-2xl border border-outline-variant/30">
              <img 
                src="/images/hero-student.png" 
                alt="Kenyan student learning" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback visual illustration if public image doesn't render immediately
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Fallback elegant graphical background in case local images load lazily */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-amber-500/10 -z-10 flex items-center justify-center p-8 text-center text-gray-400">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                    <GraduationCap className="w-10 h-10" />
                  </div>
                  <p className="font-bold text-gray-700">Adaptive CBC Learning Portal</p>
                </div>
              </div>
            </div>

            {/* Floating Daily Goal Card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-outline/10 max-w-[250px] animate-fade-in stagger-3 hover:scale-105 transition-transform">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary">
                  <Star className="w-5 h-5 fill-tertiary" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-gray-900 tracking-tight">Daily Goal Developer</h4>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Receive your XP & Badges</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: '65%' }} />
              </div>
              <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold mt-1.5">
                <span>COMPLETED: 65%</span>
                <span className="text-primary font-extrabold">+150 XP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Designed for Modern Learning Section */}
      <section id="features" className="py-20 px-6 bg-white border-y border-outline/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
              Designed for Modern Learning
            </h2>
            <p className="text-base text-gray-500 font-semibold leading-relaxed">
              Tools built to simplify the CBC experience for students and teachers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {modernLearningFeatures.map((feat, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-outline/10 p-8 rounded-2xl transition-all duration-300 card-hover flex flex-col items-start hover:border-primary/20"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm ${feat.color}`}>
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 tracking-tight">
                  {feat.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Featured Courses Section */}
      <section id="courses" className="py-20 px-6 bg-surface-low border-b border-outline/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div className="max-w-xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-3">
                Explore Featured Courses
              </h2>
              <p className="text-sm text-gray-500 font-semibold">
                Hand-selected by our curriculum experts for maximum impact.
              </p>
            </div>
            <Link 
              href="/courses" 
              className="group inline-flex items-center text-primary font-bold text-sm mt-4 sm:mt-0 hover:text-primary/80 transition-colors uppercase tracking-wider"
            >
              View All <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredCourses.map((c) => (
              <div 
                key={c.id} 
                className="bg-white rounded-2xl overflow-hidden border border-outline/10 hover:border-primary/20 shadow-sm transition-all duration-300 card-hover"
              >
                {/* Course Header/Pattern Banner */}
                <div className={`h-40 bg-gradient-to-br ${c.imageGradient} relative p-6 flex items-center justify-center border-b border-outline/5`}>
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md">
                    <c.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>

                {/* Course Body */}
                <div className="p-6">
                  <div className="flex items-center justify-between text-[11px] font-bold tracking-wider mb-2">
                    <span className="text-secondary">{c.subject}</span>
                    <span className="text-tertiary flex items-center font-extrabold">
                      <Star className="w-3.5 h-3.5 fill-tertiary mr-0.5" />
                      {c.rating} ({c.reviews})
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg text-gray-900 mb-2 leading-tight">
                    {c.title}
                  </h3>
                  
                  <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 min-h-[40px]">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div>
                      <span className="text-xs text-gray-400 font-bold block leading-none">PRICE</span>
                      <span className="text-lg font-extrabold text-gray-900">
                        KSh {c.price.toLocaleString()}
                      </span>
                    </div>
                    
                    <Link 
                      href={`/courses/${c.id}`} 
                      className="bg-primary text-white font-extrabold text-xs px-5 py-2.5 rounded-lg hover:bg-primary/95 transition-all shadow-sm active:scale-95 hover:shadow"
                    >
                      Enroll Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Master Any Subject Section */}
      <section id="subjects" className="py-20 px-6 bg-white border-b border-outline/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-4">
              Master Any Subject
            </h2>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed">
              Explore subject paths built specifically to follow the Kenyan CBC competencies.
            </p>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
            {subjectCards.map((sub, idx) => (
              <div 
                key={idx} 
                className={`p-6 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 card-hover ${sub.color}`}
              >
                <span className="text-3xl mb-4 select-none">{sub.icon}</span>
                <span className="font-extrabold text-sm tracking-tight text-gray-900">{sub.name}</span>
              </div>
            ))}
          </div>

          {/* Lumina Suggests Banner */}
          <div className="bg-primary/5 rounded-2xl border border-primary/10 p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-4 max-w-4xl mx-auto hover:bg-primary/10 transition-colors duration-300">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 animate-pulse">
                <Sparkles className="w-5 h-5 fill-primary" />
              </div>
              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                <span className="font-bold text-gray-900">Adaptive CBC Suggests:</span> Based on your Grade 4 profile, most students are currently learning <strong className="text-primary">Energy Transfer</strong> in Science. Would you like to start a practice session?
              </p>
            </div>
            <button className="bg-primary text-white font-extrabold text-xs px-5 py-2.5 rounded-lg hover:bg-primary/95 transition-all shadow-sm shrink-0 whitespace-nowrap active:scale-95">
              Start Practice
            </button>
          </div>
        </div>
      </section>

      {/* Your Path to Excellence Section */}
      <section id="practice" className="py-20 px-6 bg-surface-low border-b border-outline/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-4">
              Your Path to Excellence
            </h2>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed">
              Achieve total concept mastery using our three-step adaptive loop.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-outline/10 p-8 flex flex-col items-center text-center shadow-sm relative">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-sm mb-6 shadow">
                  {step.number}
                </div>
                <h3 className="font-extrabold text-lg text-gray-900 mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-white border-b border-outline/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-4">
              Trusted by Parents & Students
            </h2>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed">
              Read real success stories from our amazing Adaptive CBC community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div 
                key={idx} 
                className="bg-surface-low border border-outline/10 p-8 rounded-2xl flex flex-col justify-between shadow-sm transition-all hover:border-primary/20"
              >
                <div className="space-y-4">
                  <div className="flex items-center text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current mr-0.5" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 italic font-semibold leading-relaxed">
                    "{t.content}"
                  </p>
                </div>

                <div className="flex items-center space-x-3 mt-8 pt-6 border-t border-outline/5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-extrabold text-xs text-primary shadow-sm">
                    {t.image}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 leading-tight">{t.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Students & Institutions */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
              Join the Adaptive CBC Community
            </h2>
            <p className="text-base text-gray-500 font-semibold leading-relaxed">
              Whether you're a student looking to excel or a school administrator ready to bring your institution onboard, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Student CTA Card */}
            <div className="bg-white border border-outline/10 rounded-2xl p-10 shadow-sm transition-all duration-300 card-hover hover:border-primary/20 flex flex-col items-start text-left">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">
                For Students &amp; Parents
              </h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8 flex-1">
                Get personalized AI-adaptive practice, access the digital library, connect with top tutors, and track your progress — all aligned to the CBC curriculum.
              </p>
              <div className="space-y-3 mb-8 w-full">
                <div className="flex items-center space-x-3 text-sm text-gray-600 font-semibold">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span>AI-powered adaptive quizzes &amp; practice</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600 font-semibold">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span>Digital library with past papers &amp; notes</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600 font-semibold">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span>1-on-1 tutoring &amp; progress tracking</span>
                </div>
              </div>
              <Link
                href="/register"
                className="bg-primary text-white font-extrabold text-sm px-8 py-3.5 rounded-full hover:bg-primary/90 transition-all active:scale-95 shadow-md text-center w-full uppercase tracking-wider"
              >
                Start Learning
              </Link>
            </div>

            {/* Institution CTA Card */}
            <div className="bg-gradient-to-br from-primary to-[#0f542c] rounded-2xl p-10 shadow-2xl text-white flex flex-col items-start text-left relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
              <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center mb-6 shadow-sm backdrop-blur-sm relative">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight relative">
                For Schools &amp; Institutions
              </h3>
              <p className="text-sm text-white/80 font-medium leading-relaxed mb-8 flex-1 relative">
                Register your school to unlock institution-wide accounts, manage teachers and students, access premium content, and get detailed analytics on learner performance.
              </p>
              <div className="space-y-3 mb-8 w-full relative">
                <div className="flex items-center space-x-3 text-sm text-white/90 font-semibold">
                  <CheckCircle className="w-5 h-5 text-white shrink-0" />
                  <span>Bulk student &amp; teacher account management</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-white/90 font-semibold">
                  <CheckCircle className="w-5 h-5 text-white shrink-0" />
                  <span>Institution analytics &amp; performance reports</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-white/90 font-semibold">
                  <CheckCircle className="w-5 h-5 text-white shrink-0" />
                  <span>Premium content library &amp; assessment tools</span>
                </div>
              </div>
              <Link
                href="/register"
                className="bg-white text-primary font-extrabold text-sm px-8 py-3.5 rounded-full hover:bg-white/90 transition-all active:scale-95 shadow-md text-center w-full uppercase tracking-wider relative"
              >
                Register Your School
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-6 border-t border-outline/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Footer Logo & Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img src="/logo.svg" alt="Adaptive CBC" className="h-8 w-auto" />
                <span className="text-lg font-bold text-white tracking-tight">
                  Adaptive<span className="text-primary">CBC</span>
                </span>
              </div>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                The intelligent companion for every Kenyan student, making the CBC curriculum accessible, engaging, and personal.
              </p>
            </div>

            {/* Column 1: Platform */}
            <div>
              <h4 className="font-extrabold text-sm text-white uppercase tracking-wider mb-6">Platform</h4>
              <ul className="space-y-3.5 text-sm font-semibold">
                <li><Link href="#courses" className="hover:text-primary transition-colors text-gray-400 hover:text-white">Courses</Link></li>
                <li><Link href="#practice" className="hover:text-primary transition-colors text-gray-400 hover:text-white">Practice Quiz</Link></li>
                <li><Link href="#tutors" className="hover:text-primary transition-colors text-gray-400 hover:text-white">Tutors</Link></li>
                <li><Link href="#pricing" className="hover:text-primary transition-colors text-gray-400 hover:text-white">Pricing</Link></li>
              </ul>
            </div>

            {/* Column 2: Company */}
            <div>
              <h4 className="font-extrabold text-sm text-white uppercase tracking-wider mb-6">Company</h4>
              <ul className="space-y-3.5 text-sm font-semibold">
                <li><Link href="/about" className="hover:text-primary transition-colors text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-primary transition-colors text-gray-400 hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-colors text-gray-400 hover:text-white">Blog</Link></li>
              </ul>
            </div>

            {/* Column 3: Newsletter */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm text-white uppercase tracking-wider mb-6">Newsletter</h4>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Stay updated with the latest CBC curriculum changes and Adaptive CBC features.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex items-center bg-gray-800 rounded-lg p-1.5 border border-outline/10 focus-within:border-primary/50 transition-colors">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="bg-transparent text-xs w-full py-1.5 pl-2 outline-none text-white placeholder-gray-500 font-medium"
                />
                <button 
                  type="submit" 
                  className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-md hover:bg-primary/95 transition-all shadow-md active:scale-95 shrink-0"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Footer block */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-wider">
            <p>&copy; {new Date().getFullYear()} Adaptive CBC. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}