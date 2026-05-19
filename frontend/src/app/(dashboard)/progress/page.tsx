'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  BookOpen,
  Clock,
  Flame,
  Star,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import Link from 'next/link';

const MOCK_SUBJECTS = [
  { name: 'Mathematics', progress: 72, trend: 'up', color: 'bg-blue-500' },
  { name: 'English', progress: 85, trend: 'up', color: 'bg-purple-500' },
  { name: 'Science', progress: 58, trend: 'down', color: 'bg-green-500' },
  { name: 'Social Studies', progress: 90, trend: 'up', color: 'bg-orange-500' },
  { name: 'Kiswahili', progress: 65, trend: 'up', color: 'bg-pink-500' },
];

const MOCK_TOPICS = [
  { subject: 'Mathematics', topic: 'Fractions & Decimals', mastery: 85, lastPracticed: '2 days ago' },
  { subject: 'Mathematics', topic: 'Algebra Basics', mastery: 72, lastPracticed: '5 days ago' },
  { subject: 'English', topic: 'Grammar - Verbs', mastery: 90, lastPracticed: '1 day ago' },
  { subject: 'Science', topic: 'Plant Life', mastery: 45, lastPracticed: '1 week ago' },
  { subject: 'Social Studies', topic: 'Kenyan History', mastery: 78, lastPracticed: '3 days ago' },
];

const WEEKLY_ACTIVITY = [
  { day: 'Mon', practice: 45, time: 35 },
  { day: 'Tue', practice: 60, time: 45 },
  { day: 'Wed', practice: 30, time: 25 },
  { day: 'Thu', practice: 85, time: 60 },
  { day: 'Fri', practice: 50, time: 40 },
  { day: 'Sat', practice: 95, time: 75 },
  { day: 'Sun', practice: 40, time: 30 },
];

export default function ProgressPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const isParent = user.role === 'parent';
  const isCandidate = Number(user.grade) === 6 || Number(user.grade) === 9;
  const primaryColor = isCandidate ? 'amber' : 'indigo';

  if (isParent) {
    return (
      <div className="space-y-8">
        {/* Parent View - Child Progress */}
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold text-slate-900"
          >
            Progress <span className="text-emerald-600">Reports</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-600 mt-2"
          >
            Track your children's learning journey
          </motion.p>
        </div>

        {/* Select Child */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
        >
          <h2 className="font-bold text-slate-900 mb-4">Select Child</h2>
          <div className="flex gap-4">
            {[
              { name: 'Alex Mwangi', grade: 4, active: true },
              { name: 'Emma Wanjiku', grade: 6, active: false },
            ].map((child, i) => (
              <button
                key={i}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  child.active 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${Number(child.grade) === 6 ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {child.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">{child.name}</p>
                    <p className="text-sm text-slate-500">Grade {child.grade}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Overall Progress', value: '78%', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
            { label: 'Topics Mastered', value: '24', icon: Award, color: 'bg-amber-50 text-amber-600' },
            { label: 'Practice Time', value: '12h', icon: Clock, color: 'bg-blue-50 text-blue-600' },
            { label: 'Current Streak', value: '5 days', icon: Flame, color: 'bg-orange-50 text-orange-600' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
            >
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Subject Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              Subject Performance
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {MOCK_SUBJECTS.map((subject, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-700">{subject.name}</span>
                  <span className="font-bold text-slate-900">{subject.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`${subject.color} h-3 rounded-full transition-all duration-1000`}
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Student View
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-extrabold text-slate-900"
        >
          My <span className={isCandidate ? 'text-amber-600' : 'text-indigo-600'}>Progress</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-600 mt-2"
        >
          Track your learning journey and achievements
        </motion.p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Progress', value: '72%', icon: TrendingUp, sub: '+5% this week', trend: 'up' },
          { label: 'Topics Mastered', value: '24', icon: Award, sub: '3 this month', trend: 'up' },
          { label: 'Practice Time', value: '12h', icon: Clock, sub: '2h this week', trend: 'up' },
          { label: 'Current Streak', value: '5 days', icon: Flame, sub: 'Best: 12 days', trend: 'neutral' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCandidate ? 'bg-amber-100' : 'bg-indigo-100'}`}>
                <stat.icon className={`w-6 h-6 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
              </div>
              {stat.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
              {stat.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
            </div>
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className={`w-5 h-5 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
            Weekly Activity
          </h2>
          <div className="flex items-end justify-between h-40 gap-2">
            {WEEKLY_ACTIVITY.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t-lg ${isCandidate ? 'bg-amber-500' : 'bg-indigo-500'} transition-all`}
                  style={{ height: `${day.practice}%` }}
                />
                <span className="text-xs text-slate-500 mt-2">{day.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Subject Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <PieChart className={`w-5 h-5 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
            Subject Progress
          </h2>
          <div className="space-y-5">
            {MOCK_SUBJECTS.map((subject, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-700">{subject.name}</span>
                  <span className="font-bold text-slate-900">{subject.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`${subject.color} h-2.5 rounded-full transition-all duration-1000`}
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Topic Mastery */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target className={`w-6 h-6 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
            Topic Mastery
          </h2>
          <button className={`text-sm font-semibold ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`}>
            View All
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {MOCK_TOPICS.map((topic, i) => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  topic.mastery >= 80 ? 'bg-green-100' : topic.mastery >= 50 ? 'bg-amber-100' : 'bg-red-100'
                }`}>
                  <BookOpen className={`w-6 h-6 ${
                    topic.mastery >= 80 ? 'text-green-600' : topic.mastery >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{topic.topic}</h3>
                  <p className="text-sm text-slate-500">{topic.subject}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900">{topic.mastery}%</span>
                  {topic.mastery >= 80 ? (
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">{topic.lastPracticed}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Award className={`w-5 h-5 ${isCandidate ? 'text-amber-600' : 'text-indigo-600'}`} />
          Recent Achievements
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🔥', title: '5 Day Streak', desc: 'Practice every day' },
            { icon: '📚', title: 'Quick Learner', desc: 'Mastered 5 topics' },
            { icon: '🎯', title: 'Perfect Score', desc: '100% in Math quiz' },
            { icon: '⭐', title: 'Top 10', desc: 'Leaderboard rank' },
          ].map((badge, i) => (
            <div key={i} className={`p-4 rounded-xl text-center ${isCandidate ? 'bg-amber-50' : 'bg-indigo-50'}`}>
              <span className="text-3xl">{badge.icon}</span>
              <p className="font-bold text-slate-900 mt-2">{badge.title}</p>
              <p className="text-xs text-slate-500">{badge.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}