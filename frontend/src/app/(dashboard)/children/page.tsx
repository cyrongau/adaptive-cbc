'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Users, GraduationCap, TrendingUp, BookOpen, Trophy, Flame, BarChart3 } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  grade: number;
  streak: number;
  xp: number;
  weeklyProgress: number;
  subjects: { name: string; progress: number }[];
}

const MOCK_CHILDREN: Child[] = [
  { 
    id: '1', 
    name: 'Alex Mwangi', 
    grade: 4, 
    streak: 5, 
    xp: 1250, 
    weeklyProgress: 78,
    subjects: [
      { name: 'Mathematics', progress: 82 },
      { name: 'English', progress: 65 },
      { name: 'Science', progress: 88 },
    ]
  },
  { 
    id: '2', 
    name: 'Emma Wanjiku', 
    grade: 6, 
    streak: 12, 
    xp: 3450, 
    weeklyProgress: 92,
    subjects: [
      { name: 'Mathematics', progress: 95 },
      { name: 'English', progress: 78 },
      { name: 'Science', progress: 90 },
    ]
  },
];

export default function ChildrenPage() {
  const { user } = useAuthStore();
  const isParent = user?.role === 'parent';

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
          { label: 'Total Children', value: MOCK_CHILDREN.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
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

      {/* Children List */}
      <div className="space-y-4">
        {MOCK_CHILDREN.map((child) => (
          <div key={child.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-emerald-700">{child.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{child.name}</h3>
                  <p className="text-sm text-slate-500">Grade {child.grade} • Student</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="w-5 h-5" />
                    <span className="font-bold">{child.streak}</span>
                  </div>
                  <p className="text-xs text-slate-500">day streak</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-amber-600">
                    <Trophy className="w-5 h-5" />
                    <span className="font-bold">{child.xp.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-500">XP</p>
                </div>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Weekly Progress</span>
                <span className="text-sm font-bold text-emerald-600">{child.weeklyProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full"
                  style={{ width: `${child.weeklyProgress}%` }}
                />
              </div>
            </div>

            {/* Subject Progress */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-bold text-slate-700 mb-3">Subject Progress</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {child.subjects.map((subject, i) => (
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
        ))}
      </div>
    </div>
  );
}