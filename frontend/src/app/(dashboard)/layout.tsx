'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import { getAvatarUrl } from '@/lib/utils';
import api from '@/lib/api';
import {
  LayoutDashboard,
  BookOpen,
  PenTool,
  Trophy,
  BarChart2,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  User as UserIcon,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ChevronDown,
  UserCircle,
  GraduationCap,
  Calendar,
  FolderOpen,
  FileText,
  Building2,
  Shield,
  ShoppingBag,
  Users
} from 'lucide-react';
import Image from 'next/image';
import NotificationBell from '@/components/NotificationBell';

const SIDEBAR_ITEMS_STUDENT = [
  { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Course Hub', icon: BookOpen, href: '/course-hub' },
  { label: 'Adaptive Practice', icon: PenTool, href: '/practice' },
  { label: 'School', icon: Building2, href: '/school' },
  { label: 'Digital Library', icon: FolderOpen, href: '/library' },
  { label: 'Store', icon: ShoppingBag, href: '/store' },
  { label: 'Materials', icon: FileText, href: '/materials' },
  { label: 'My Progress', icon: BarChart2, href: '/progress' },
  { label: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
];

const SIDEBAR_ITEMS_AFFILIATED_STUDENT = [
  { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Course Hub', icon: BookOpen, href: '/course-hub' },
  { label: 'Adaptive Practice', icon: PenTool, href: '/practice' },
  { label: 'My School', icon: Building2, href: '/school' },
  { label: 'My Teachers', icon: Users, href: '/school' },
  { label: 'Store', icon: ShoppingBag, href: '/store' },
  { label: 'School Materials', icon: FileText, href: '/materials' },
  { label: 'Digital Library', icon: FolderOpen, href: '/library' },
  { label: 'My Progress', icon: BarChart2, href: '/progress' },
  { label: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
];

const SIDEBAR_ITEMS_PARENT = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Course Hub', icon: BookOpen, href: '/course-hub' },
  { label: 'Children', icon: GraduationCap, href: '/children' },
  { label: 'Store', icon: ShoppingBag, href: '/store' },
  { label: 'Digital Library', icon: FolderOpen, href: '/library' },
  { label: 'Progress Reports', icon: BarChart2, href: '/progress' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

const SIDEBAR_ITEMS_TUTOR = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Course Hub', icon: BookOpen, href: '/course-hub' },
  { label: 'My Courses', icon: BookOpen, href: '/my-courses' },
  { label: 'Students', icon: GraduationCap, href: '/students' },
  { label: 'Sessions', icon: BookOpen, href: '/sessions' },
  { label: 'KYC Verification', icon: Shield, href: '/kyc' },
  { label: 'Store', icon: ShoppingBag, href: '/store' },
  { label: 'Progress', icon: BarChart2, href: '/progress' },
  { label: 'Materials', icon: FileText, href: '/materials' },
  { label: 'Schedule', icon: PenTool, href: '/schedule' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

const SIDEBAR_ITEMS_TEACHER = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Course Hub', icon: BookOpen, href: '/course-hub' },
  { label: 'My Courses', icon: BookOpen, href: '/my-courses' },
  { label: 'Students', icon: GraduationCap, href: '/students' },
  { label: 'Classes', icon: BookOpen, href: '/classes' },
  { label: 'Assignments', icon: PenTool, href: '/assignments' },
  { label: 'School', icon: Building2, href: '/school' },
  { label: 'Schedule', icon: Calendar, href: '/schedule' },
  { label: 'Store', icon: ShoppingBag, href: '/store' },
  { label: 'Digital Library', icon: FolderOpen, href: '/library' },
  { label: 'Materials', icon: FileText, href: '/materials' },
  { label: 'Analytics', icon: BarChart2, href: '/analytics' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

const SIDEBAR_ITEMS_ADMIN = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Users', icon: GraduationCap, href: '/admin/users' },
  { label: 'Institutions', icon: BookOpen, href: '/admin/institutions' },
  { label: 'Analytics', icon: BarChart2, href: '/admin/analytics' },
  { label: 'Content', icon: PenTool, href: '/admin/content' },
  { label: 'Reports', icon: FileText, href: '/admin/reports' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, initialize, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTopNavUserMenuOpen, setIsTopNavUserMenuOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const topNavUserMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initialize();
    setIsMounted(true);
  }, [initialize]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (topNavUserMenuRef.current && !topNavUserMenuRef.current.contains(event.target as Node)) {
        setIsTopNavUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isParent = user?.role === 'parent';
  const isTeacher = user?.role === 'teacher';
  const isTutor = user?.role === 'tutor';
  const isSuperAdmin = user?.role === 'super_admin';
  const isInstitutionAdmin = user?.role === 'institution_admin';
  const isKycApproved = user?.kycStatus === 'approved';
  const isAdmin = isSuperAdmin || isInstitutionAdmin;

  useEffect(() => {
    if (isMounted && isInstitutionAdmin && isKycApproved && user?.institutionId) {
      fetchInstitutionName();
    }
  }, [isMounted, isInstitutionAdmin, isKycApproved, user?.institutionId]);

  const fetchInstitutionName = async () => {
    try {
      const res = await api.get('/institutions/my');
      if (res.data) {
        setInstitutionName(res.data.name || null);
      }
    } catch (error) {
      console.error('Failed to fetch institution:', error);
    }
  };
  const isCandidate = user?.role === 'student' && (Number(user?.grade) === 6 || Number(user?.grade) === 9);

  const theme = getTheme(user?.role || 'student', isCandidate);

  useEffect(() => {
    if (isMounted && isSuperAdmin) {
      router.push('/admin/dashboard');
    }
    if (isMounted && isInstitutionAdmin && isKycApproved) {
      router.push('/admin/dashboard');
    }
  }, [isMounted, isSuperAdmin, isInstitutionAdmin, isKycApproved, router]);

  const isAffiliatedStudent = user?.role === 'student' && user?.institutionId;

  let SIDEBAR_ITEMS;
  if (isInstitutionAdmin && !isKycApproved) {
    SIDEBAR_ITEMS = [
      { label: 'Application Status', icon: Shield, href: '/onboarding/institution-admin' },
    ];
  } else if (isTutor) SIDEBAR_ITEMS = SIDEBAR_ITEMS_TUTOR;
  else if (isTeacher) SIDEBAR_ITEMS = SIDEBAR_ITEMS_TEACHER;
  else if (isParent) SIDEBAR_ITEMS = SIDEBAR_ITEMS_PARENT;
  else if (isAffiliatedStudent) SIDEBAR_ITEMS = SIDEBAR_ITEMS_AFFILIATED_STUDENT;
  else SIDEBAR_ITEMS = SIDEBAR_ITEMS_STUDENT;

  // Protected route enforcement
  useEffect(() => {
    if (isMounted && !token) {
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`/login?callbackUrl=${callbackUrl}&authRequired=true`);
    }
  }, [isMounted, token, router, pathname]);

  if (!isMounted || !token || !user || isSuperAdmin || (isInstitutionAdmin && isKycApproved)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const sidebarWidth = sidebarCollapsed ? theme.collapsedWidth : theme.expandedWidth;

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden font-sans">

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${theme.gradient} rounded-lg flex items-center justify-center`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">Adaptive CBC</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-100 text-slate-600 rounded-md"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed md:sticky top-0 left-0 ${sidebarWidth === theme.collapsedWidth ? 'w-16' : 'w-64'}
          ${theme.sidebarBg} z-50
          flex flex-col h-screen
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-300 ease-in-out
        `}
      >
        {/* Brand + Toggle */}
        <div className={`flex items-center py-5 px-4 border-b ${theme.sidebarBorder} ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <img src="/logo.svg" alt="Adaptive CBC" className="w-9 h-9 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-sm text-slate-900 tracking-tight block truncate">Adaptive CBC</span>
                <span className="text-[10px] text-slate-500 font-medium">Learning Platform</span>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <img src="/logo.svg" alt="Adaptive CBC" className="w-9 h-9 shrink-0" />
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden md:flex items-center justify-center w-6 h-6 rounded-full ${theme.toggleBtnBg} ${theme.toggleBtn} hover:shadow-md transition-all shrink-0 ${sidebarCollapsed ? 'absolute -right-3 top-5' : ''}`}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* User Profile Summary */}
        <div className={`px-4 py-4 border-b ${theme.sidebarBorder} ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          {sidebarCollapsed ? (
            <div className={`w-10 h-10 rounded-full ${theme.avatarBg} ${theme.avatarText} flex items-center justify-center font-bold text-sm overflow-hidden`}>
              {user.avatar ? (
                <Image src={getAvatarUrl(user.avatar)} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <>{user.firstName[0]}{user.lastName[0]}</>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className={`w-11 h-11 rounded-full ${theme.avatarBg} ${theme.avatarText} flex items-center justify-center font-bold text-sm overflow-hidden`}>
                  {user.avatar ? (
                    <Image src={getAvatarUrl(user.avatar)} alt="Avatar" width={44} height={44} className="w-full h-full object-cover" />
                  ) : (
                    <>{user.firstName[0]}{user.lastName[0]}</>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm truncate">{user.firstName} {user.lastName}</h3>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {isInstitutionAdmin && !isKycApproved ? 'Pending Approval' : isParent ? 'Parent' : isTeacher ? 'Teacher' : isTutor ? 'Tutor' : isAffiliatedStudent ? `Grade ${user.grade} • Affiliated` : isCandidate ? `Grade ${user.grade} Candidate` : `Grade ${user.grade || 'N/A'}`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation (scrollable) */}
        <nav className={`flex-1 overflow-y-auto py-3 px-2 space-y-0.5 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-150 group
                  ${isActive
                    ? `${theme.sidebarActiveBg} ${theme.sidebarActiveText} font-semibold`
                    : `${theme.sidebarText} ${theme.sidebarHover} font-medium`}
                  ${sidebarCollapsed ? 'mx-auto w-10 h-10' : ''}
                `}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? theme.sidebarIcon : 'text-slate-400 group-hover:text-slate-600'}`} />
                {!sidebarCollapsed && (
                  <>
                    <span className="truncate text-sm">{item.label}</span>
                    {isActive && (
                      <motion.div layoutId="sidebar-active-indicator" className={`w-1.5 h-1.5 rounded-full ${theme.sidebarIcon.replace('text-', 'bg-')} ml-auto shrink-0`} />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Segment: Profile Dropdown + Settings + Logout */}
        <div className={`border-t ${theme.sidebarBorder} ${sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-3'}`}>
          <div className="relative" ref={userMenuRef}>
            {sidebarCollapsed ? (
              <div className="space-y-1">
                <Link
                  href="/settings"
                  className="flex items-center justify-center w-10 h-10 mx-auto text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-10 h-10 mx-auto text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                {/* User Avatar Menu Trigger */}
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg ${theme.sidebarHover} transition-colors`}
                >
                  <div className={`w-8 h-8 rounded-full ${theme.avatarBg} ${theme.avatarText} flex items-center justify-center font-bold text-xs overflow-hidden shrink-0`}>
                    {user.avatar ? (
                      <Image src={getAvatarUrl(user.avatar)} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <>{user.firstName[0]}{user.lastName[0]}</>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="font-bold text-slate-900 text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <UserCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">My Profile</span>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm font-medium">Settings</span>
                      </Link>

                      <div className="border-t border-slate-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Settings & Logout quick actions */}
                <div className="flex items-center gap-1 mt-1">
                  <Link
                    href="/settings"
                    className="flex-1 flex items-center justify-center gap-2 px-2 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex-1 flex items-center justify-center gap-2 px-2 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar (Desktop only) */}
        <header className={`hidden md:flex h-16 ${theme.headerBg} items-center justify-between px-8 shrink-0`}>
          <div className={`${theme.headerMuted} font-medium text-sm flex items-center gap-2`}>
            <span>{isAdmin && institutionName ? `${institutionName}` : isAdmin ? 'Admin Dashboard' : isTutor ? 'Tutor Dashboard' : isTeacher ? 'Teacher Dashboard' : isParent ? 'Parent Dashboard' : 'Student Dashboard'}</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
            <span className={`${theme.headerText} capitalize`}>
              {pathname.split('/')[1] || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <NotificationBell />
            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            {/* User Menu with Avatar */}
            <div className="relative" ref={topNavUserMenuRef}>
              <button
                onClick={() => setIsTopNavUserMenuOpen(!isTopNavUserMenuOpen)}
                className={`flex items-center gap-3 py-1.5 px-3 rounded-full border ${theme.headerBorder} ${theme.sidebarHover} transition-all`}
              >
                <div className={`w-8 h-8 rounded-full ${theme.avatarBg} ${theme.avatarText} flex items-center justify-center font-bold text-sm overflow-hidden`}>
                  {user?.avatar ? (
                    <Image src={getAvatarUrl(user.avatar)} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-bold text-slate-900 leading-tight">{user?.firstName}</div>
                  <div className="text-xs text-slate-500">{isParent ? 'Parent' : isTeacher ? 'Teacher' : isTutor ? 'Tutor' : isInstitutionAdmin ? 'Institution Admin' : `Grade ${user?.grade || 'N/A'}`}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isTopNavUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isTopNavUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-bold text-slate-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-slate-500">{user?.email}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setIsTopNavUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span className="font-medium">{isAdmin ? 'Admin Dashboard' : isTutor ? 'Tutor Dashboard' : isTeacher ? 'Teacher Dashboard' : isParent ? 'Parent Dashboard' : 'Student Dashboard'}</span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setIsTopNavUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <UserCircle className="w-5 h-5" />
                      <span className="font-medium">My Profile</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsTopNavUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-medium">Settings</span>
                    </Link>

                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 ${theme.mainContainer}`}>
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
