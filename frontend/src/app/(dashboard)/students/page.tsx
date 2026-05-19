'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Users, Search, Filter } from 'lucide-react';

export default function StudentsPage() {
  const { user } = useAuthStore();
  
  if (!user) return null;

  const roleLabel = user.role === 'teacher' ? 'Teacher' : user.role === 'tutor' ? 'Tutor' : 'Admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Manage your students</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
            <Users className="w-5 h-5" />
            Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">{roleLabel} students management will appear here.</p>
      </div>
    </div>
  );
}