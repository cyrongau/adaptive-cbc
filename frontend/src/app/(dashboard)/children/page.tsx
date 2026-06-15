'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Users, GraduationCap, TrendingUp, BookOpen, Trophy, Flame, BarChart3, Eye, ChevronDown, ChevronRight } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  grade: number;
  streak: number;
  xp: number;
  weeklyProgress: number;
  subjects: { name: string; progress: number }[];
}

interface UserRelationship {
  id: string;
  relationshipType: string;
  verificationStatus: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    grade: number;
    streakDays: number;
    xpPoints: number;
    // mock properties for ui matching
    weeklyProgress?: number;
    subjects?: { name: string; progress: number }[];
  };
}

export default function ChildrenPage() {
  const { user } = useAuthStore();
  const isParent = user?.role === 'parent';
  const [children, setChildren] = useState<UserRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinChildren, setPinChildren] = useState<any[]>([]);
  const [showPinList, setShowPinList] = useState(false);

  useEffect(() => {
    if (isParent && user?.id) {
      const fetchChildren = async () => {
        try {
          // Auto-link parent to any students registered with matching parent email
          await api.post('/auth/link-parent').catch(() => {});

          const res = await api.get(`/relationships/parent/${user.id}/children`);
          setChildren(res.data || []);

          const pinRes = await api.get('/students/parent-pin-list');
          setPinChildren(pinRes.data || []);
        } catch (error) {
          console.error("Failed to fetch children", error);
        } finally {
          setLoading(false);
        }
      };
      fetchChildren();
    } else {
      setLoading(false);
    }
  }, [isParent, user?.id]);

  if (!isParent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Children</h1>
          <p className="text-slate-500 mt-1">Monitor your children's progress</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">This section is for parents only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Children</h1>
        <p className="text-slate-500 mt-1">Monitor your children's learning progress</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Children', value: children.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Avg Progress', value: '85%', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Active Streaks', value: '17 days', icon: Flame, color: 'bg-orange-50 text-orange-600' },
          { label: 'Topics Mastered', value: '24', icon: Trophy, color: 'bg-amber-50 text-amber-600' },
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

      {/* Temporary PIN Pending Children */}
      {pinChildren.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowPinList(!showPinList)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-amber-100/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-bold text-amber-800 uppercase tracking-wider">
                {pinChildren.length} Child{pinChildren.length > 1 ? 'ren' : ''} Need PIN Setup
              </span>
            </div>
            {showPinList ? <ChevronDown className="w-4 h-4 text-amber-600" /> : <ChevronRight className="w-4 h-4 text-amber-600" />}
          </button>
          {showPinList && (
            <div className="border-t border-amber-200 px-6 py-4 space-y-3">
              {pinChildren.map((c: any) => (
                <div key={c.userId} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-amber-100">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-slate-500">Grade {c.grade} • {c.admissionNumber || c.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-600 font-mono tracking-widest">{c.temporaryPin}</p>
                    <p className="text-[10px] text-slate-400 uppercase">Temporary PIN</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Children List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading children...</div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No Children Linked</h3>
            <p className="text-slate-500 mt-2">Your students need to invite you from their onboarding or settings page.</p>
          </div>
        ) : children.map((rel) => {
          const child = rel.student;
          if (!child) return null;
          
          const fullName = `${child.firstName} ${child.lastName}`;
          const weeklyProgress = child.weeklyProgress || 0;
          const subjects = child.subjects || [
            { name: 'Mathematics', progress: 0 },
            { name: 'English', progress: 0 },
            { name: 'Science', progress: 0 }
          ];
          
          return (
          <div key={rel.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
            {rel.verificationStatus === 'unverified' && (
              <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-bl-lg">
                Pending Verification
              </div>
            )}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-emerald-700">{child.firstName?.[0]}{child.lastName?.[0]}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{fullName}</h3>
                  <p className="text-sm text-slate-500">Grade {child.grade || 'N/A'} • {rel.relationshipType}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="w-5 h-5" />
                    <span className="font-bold">{child.streakDays || 0}</span>
                  </div>
                  <p className="text-xs text-slate-500">day streak</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-amber-600">
                    <Trophy className="w-5 h-5" />
                    <span className="font-bold">{(child.xpPoints || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-500">XP</p>
                </div>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Weekly Progress</span>
                <span className="text-sm font-bold text-emerald-600">{weeklyProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-bold text-slate-700 mb-3">Subject Progress</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {subjects.map((subject, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{subject.name}</span>
                      <span className="text-sm font-bold text-slate-900">{subject.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          subject.progress >= 80 ? 'bg-green-500' :
                          subject.progress >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100">
                <BarChart3 className="w-4 h-4" />
                View Detailed Progress
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl font-medium hover:bg-slate-100">
                <BookOpen className="w-4 h-4" />
                View Assignments
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}