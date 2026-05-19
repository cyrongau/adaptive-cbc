'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { getTheme } from '@/lib/theme';
import { getAvatarUrl } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart2,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Shield,
  FileText,
  Search,
  GraduationCap,
  UserCheck,
  Building2,
  ChevronDown,
  UserCircle,
  Crown,
  UserPlus,
  Wallet,
} from 'lucide-react';
import Image from 'next/image';

const SUPER_ADMIN_SIDEBAR = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'User Management', icon: Users, href: '/admin/users' },
  { label: 'KYC Applications', icon: UserCheck, href: '/admin/kyc-applications' },
  { label: 'KYC Verification', icon: Shield, href: '/admin/verification' },
  { label: 'Institutions', icon: Building2, href: '/admin/institutions' },
  { label: 'Financial Oversight', icon: Wallet, href: '/admin/financial' },
  { label: 'Content Moderation', icon: BookOpen, href: '/admin/content' },
  { label: 'Analytics', icon: BarChart2, href: '/admin/analytics' },
  { label: 'Reports', icon: FileText, href: '/admin/reports' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

const INSTITUTION_ADMIN_SIDEBAR = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'My Institution', icon: Building2, href: '/admin/institution' },
  { label: 'Student Register', icon: GraduationCap, href: '/admin/students' },
  { label: 'Join Requests', icon: UserPlus, href: '/admin/join-requests' },
  { label: 'Teachers', icon: Users, href: '/admin/teachers' },
  { label: 'Analytics', icon: BarChart2, href: '/admin/analytics' },
  { label: 'Reports', icon: FileText, href: '/admin/reports' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

export default function AdminLayout({
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
  const [pendingJoinRequests, setPendingJoinRequests] = useState(0);
  const [institutionName, setInstitutionName] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initialize();
    setIsMounted(true);
  }, [initialize]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';
  const isInstitutionAdmin = user?.role === 'institution_admin';
  const isKycApproved = user?.kycStatus === 'approved';
  const isAdmin = isSuperAdmin || isInstitutionAdmin;

  useEffect(() => {
    if (isMounted && isInstitutionAdmin && isKycApproved) {
      fetchInstitutionAndRequests();
    }
  }, [isMounted, isInstitutionAdmin, isKycApproved]);

  const fetchInstitutionAndRequests = async () => {
    try {
      const { default: api } = await import('@/lib/api');
      const instResponse = await api.get('/institutions/my').catch(() => null);
      if (instResponse?.data) {
        setInstitutionName(instResponse.data.name || null);
        const requestsResponse = await api.get(`/institutions/${instResponse.data.id}/join-requests`);
        const pending = requestsResponse.data.filter((r: any) => r.status === 'pending').length;
        setPendingJoinRequests(pending);
      }
    } catch (error) {
      console.error('Failed to fetch institution data');
    }
  };

  const theme = getTheme(user?.role || 'student', false);

  useEffect(() => {
    if (isMounted && !token) {
      router.push('/login');
    }
    if (isMounted && token && !isAdmin) {
      router.push('/dashboard');
    }
    if (isMounted && isInstitutionAdmin && !isKycApproved) {
      router.push('/dashboard');
    }
  }, [isMounted, token, isAdmin, isSuperAdmin, isInstitutionAdmin, isKycApproved, router]);

  const sidebarItems = isSuperAdmin ? SUPER_ADMIN_SIDEBAR : INSTITUTION_ADMIN_SIDEBAR;

  if (!isMounted || !token || !user || !isAdmin || (isInstitutionAdmin && !isKycApproved)) {
    return (
      <div className="min-h-screen bg-[#0b1326] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#7eda95] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#dae2fd] font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="h-screen bg-[#0b1326] flex overflow-hidden font-sans" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>

      {/* Mobile Header */}
      <header className="md:hidden bg-[#171f33] border-b border-[#2a3a5c] p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${theme.gradient} rounded-lg flex items-center justify-center`}>
            {isSuperAdmin ? <Crown className="w-4 h-4 text-[#0f1729]" /> : <Shield className="w-4 h-4 text-[#003919]" />}
          </div>
          <span className="font-bold text-lg text-[#dae2fd] tracking-tight">
            {isSuperAdmin ? 'EduAdmin' : 'Institution Admin'}
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-[#222a3d] text-[#becabd] rounded-md"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed md:sticky top-0 left-0 ${sidebarCollapsed ? 'w-16' : 'w-64'}
          ${theme.sidebarBg} z-50
          flex flex-col h-screen
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-300 ease-in-out
        `}
      >
        {/* Brand + Toggle */}
        <div className={`flex items-center py-6 px-4 border-b ${theme.sidebarBorder} ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <img src="/logo.svg" alt="Adaptive CBC" className="w-10 h-10 shrink-0" />
              <div className="min-w-0">
                <h1 className={`font-bold text-sm ${theme.brandText} tracking-tight truncate`}>
                  {isSuperAdmin ? 'EduAdmin' : (institutionName || 'Institution Admin')}
                </h1>
                <p className={`text-[10px] ${theme.brandSubtitle} font-semibold uppercase tracking-wider truncate`}>
                  {isSuperAdmin ? 'Platform Administration' : 'School Management'}
                </p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <img src="/logo.svg" alt="Adaptive CBC" className="w-10 h-10 shrink-0" />
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden md:flex items-center justify-center w-6 h-6 rounded-full ${theme.toggleBtnBg} ${theme.toggleBtn} hover:shadow-md transition-all shrink-0 ${sidebarCollapsed ? 'absolute -right-3 top-6' : ''}`}
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
                <div className={`w-11 h-11 rounded-full ${theme.avatarBg} border ${theme.sidebarBorder} flex items-center justify-center font-bold text-sm overflow-hidden`}>
                  {user.avatar ? (
                    <Image src={getAvatarUrl(user.avatar)} alt="Avatar" width={44} height={44} className="w-full h-full object-cover" />
                  ) : (
                    <>{user.firstName[0]}{user.lastName[0]}</>
                  )}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#0f1729] ${isSuperAdmin ? 'bg-amber-400' : 'bg-[#7eda95]'}`}></div>
              </div>
              <div className="min-w-0">
                <h3 className={`font-semibold ${theme.sidebarText} text-sm truncate`}>{user.firstName} {user.lastName}</h3>
                <p className={`text-[10px] ${isSuperAdmin ? 'text-amber-400/80' : 'text-[#7eda95]/80'} font-semibold uppercase tracking-wider truncate`}>
                  {isSuperAdmin ? 'Super Admin' : 'Institution Admin'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation (scrollable) */}
        <nav className={`flex-1 overflow-y-auto py-3 space-y-0.5 ${sidebarCollapsed ? 'px-2' : 'px-2'}`}>
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const showBadge = isInstitutionAdmin && item.href === '/admin/join-requests' && pendingJoinRequests > 0;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center ${sidebarCollapsed ? 'justify-center relative' : 'gap-3'} px-4 py-3 transition-all border-l-4
                  ${isActive
                    ? `${theme.sidebarActiveBg} ${theme.sidebarActiveText} ${theme.sidebarActiveBorder}`
                    : `${theme.navText} ${theme.navHover} border-transparent`}
                  ${sidebarCollapsed ? 'mx-auto w-10 h-10 border-l-0 rounded-lg' : ''}
                `}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? theme.sidebarIcon : 'opacity-70'}`} />
                {!sidebarCollapsed && (
                  <span className="text-xs font-semibold uppercase tracking-wider truncate flex-1">{item.label}</span>
                )}
                {showBadge && !sidebarCollapsed && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {pendingJoinRequests}
                  </span>
                )}
                {showBadge && sidebarCollapsed && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {pendingJoinRequests > 9 ? '9+' : pendingJoinRequests}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Segment: Profile + Logout */}
        <div className={`border-t ${theme.sidebarBorder} ${sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-4'}`}>
          <div className="relative" ref={userMenuRef}>
            {sidebarCollapsed ? (
              <div className="space-y-1">
                <Link
                  href="/admin/settings"
                  className="flex items-center justify-center w-10 h-10 mx-auto text-[#becabd] hover:text-[#7eda95] hover:bg-[#1a2540] rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-10 h-10 mx-auto text-[#ffb4ab] hover:bg-[#93000a]/20 rounded-lg transition-colors"
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
                  <div className={`w-8 h-8 rounded-full ${theme.avatarBg} border ${theme.sidebarBorder} flex items-center justify-center font-bold text-xs overflow-hidden shrink-0`}>
                    {user.avatar ? (
                      <Image src={getAvatarUrl(user.avatar)} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <>{user.firstName[0]}{user.lastName[0]}</>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-xs font-semibold ${theme.sidebarText} truncate`}>{user.firstName} {user.lastName}</p>
                    <p className={`text-[10px] ${theme.mutedText} truncate`}>{user.email}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 ${theme.mutedText} transition-transform shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-0 right-0 mb-2 bg-[#171f33] rounded-xl shadow-xl border border-[#2a3a5c] py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-[#2a3a5c]">
                        <p className="font-semibold text-[#dae2fd] text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-[#becabd]">{user.email}</p>
                      </div>

                      <Link
                        href="/admin/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[#becabd] hover:bg-[#1a2540] hover:text-[#7eda95] transition-colors"
                      >
                        <UserCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">My Profile</span>
                      </Link>

                      <Link
                        href="/admin/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[#becabd] hover:bg-[#1a2540] hover:text-[#7eda95] transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm font-medium">Settings</span>
                      </Link>

                      <div className="border-t border-[#2a3a5c] mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[#ffb4ab] hover:bg-[#93000a]/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Settings & Logout quick actions */}
                <div className="flex items-center gap-1 mt-2">
                  <Link
                    href="/admin/settings"
                    className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 ${theme.mutedText} hover:text-[#7eda95] hover:bg-[#1a2540] rounded-lg transition-colors text-xs font-medium`}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 ${theme.dangerText} ${theme.dangerHover} rounded-lg transition-colors text-xs font-medium`}
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
        {/* Top Navbar */}
        <header className={`sticky top-0 z-40 h-16 ${theme.headerBg} flex items-center justify-between px-8 shrink-0`}>
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-96">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#becabd]" />
              <input
                type="text"
                placeholder={isSuperAdmin ? "Search data, users, or logs..." : "Search teachers, students, or classes..."}
                className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-lg py-2 pl-10 pr-4 text-[#dae2fd] text-sm focus:border-[#7eda95] focus:ring-0 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 px-3 py-1.5 text-[#becabd] hover:text-[#dae2fd] hover:bg-[#222a3d] rounded-lg transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <button className="relative p-2 text-[#becabd] hover:bg-[#222a3d] rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${isSuperAdmin ? 'bg-amber-400' : 'bg-[#7eda95]'}`}></span>
            </button>
            <div className="w-px h-6 bg-[#2a3a5c]"></div>
            {/* Quick role badge */}
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${isSuperAdmin ? 'bg-amber-900/30 text-amber-300 border border-amber-700' : 'bg-[#47a263]/20 text-[#7eda95] border border-[#47a263]'}`}>
              {isSuperAdmin ? 'Super Admin' : (institutionName || 'Inst. Admin')}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={`flex-1 overflow-y-auto p-8 ${theme.mainBg}`}>
          <div className="max-w-[1600px] mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
