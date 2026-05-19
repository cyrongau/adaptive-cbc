'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { 
  Trophy, 
  Medal, 
  Crown,
  Flame,
  Star,
  TrendingUp,
  Target,
  Users
} from 'lucide-react';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Sarah K.', xp: 4850, streak: 15, grade: 5, avatar: 'SK' },
  { rank: 2, name: 'John D.', xp: 4200, streak: 12, grade: 6, avatar: 'JD' },
  { rank: 3, name: 'Emily W.', xp: 3950, streak: 8, grade: 4, avatar: 'EW' },
  { rank: 4, name: 'Michael O.', xp: 3600, streak: 10, grade: 7, avatar: 'MO' },
  { rank: 5, name: 'Anna M.', xp: 3400, streak: 6, grade: 9, avatar: 'AM' },
  { rank: 6, name: 'David K.', xp: 3100, streak: 5, grade: 4, avatar: 'DK' },
  { rank: 7, name: 'Grace L.', xp: 2900, streak: 7, grade: 5, avatar: 'GL' },
  { rank: 8, name: 'Peter N.', xp: 2650, streak: 3, grade: 6, avatar: 'PN' },
  { rank: 9, name: 'Rose A.', xp: 2400, streak: 4, grade: 8, avatar: 'RA' },
  { rank: 10, name: 'James R.', xp: 2200, streak: 2, grade: 4, avatar: 'JR' },
];

const USER_RANK = 3;
const USER_XP = 1850;

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [typeFilter, setTypeFilter] = useState('all');

  if (!user) return null;

  const isCandidate = Number(user.grade) === 6 || Number(user.grade) === 9;
  const isParent = user.role === 'parent';

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-500 bg-amber-100 border-amber-300';
    if (rank === 2) return 'text-slate-400 bg-slate-100 border-slate-300';
    if (rank === 3) return 'text-orange-600 bg-orange-100 border-orange-300';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold text-slate-900"
          >
            <span className={isCandidate ? 'text-amber-600' : 'text-indigo-600'}>Leaderboard</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-600 mt-2"
          >
            See how you rank against other learners
          </motion.p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className={`px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none`}
          >
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="all">All Time</option>
          </select>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none`}
          >
            <option value="all">All Grades</option>
            <option value="your-grade">Your Grade</option>
            <option value="candidates">Candidates Only</option>
          </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* 2nd Place */}
        <div className="order-2 md:order-1">
          <div className="bg-slate-100 rounded-t-3xl p-6 text-center border-4 border-slate-300 border-b-0">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center font-bold text-2xl text-slate-600 mx-auto -mt-16 border-4 border-slate-300">
              {MOCK_LEADERBOARD[1].avatar}
            </div>
            <h3 className="font-bold text-slate-900 mt-4">{MOCK_LEADERBOARD[1].name}</h3>
            <p className="text-2xl font-black text-slate-600 mt-2">{MOCK_LEADERBOARD[1].xp.toLocaleString()} XP</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-slate-500">
              <Flame className="w-4 h-4" />
              <span>{MOCK_LEADERBOARD[1].streak} day streak</span>
            </div>
          </div>
          <div className="bg-slate-200 h-8 rounded-b-xl flex items-center justify-center">
            <span className="text-sm font-bold text-slate-600">#2</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className="order-1 md:order-2">
          <div className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-t-3xl p-6 text-center border-4 border-amber-400 border-b-0 relative">
            <Crown className="w-8 h-8 text-amber-500 mx-auto -mt-12" />
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center font-bold text-3xl text-white mx-auto -mt-4 shadow-lg border-4 border-amber-300">
              {MOCK_LEADERBOARD[0].avatar}
            </div>
            <h3 className="font-bold text-slate-900 mt-4 text-lg">{MOCK_LEADERBOARD[0].name}</h3>
            <p className="text-3xl font-black text-amber-600 mt-2">{MOCK_LEADERBOARD[0].xp.toLocaleString()} XP</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-amber-700">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span className="font-semibold">{MOCK_LEADERBOARD[0].streak} day streak</span>
            </div>
          </div>
          <div className="bg-gradient-to-b from-amber-300 to-amber-400 h-12 rounded-b-xl flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-amber-700" />
          </div>
        </div>

        {/* 3rd Place */}
        <div className="order-3">
          <div className="bg-orange-50 rounded-t-3xl p-6 text-center border-4 border-orange-300 border-b-0">
            <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center font-bold text-xl text-orange-700 mx-auto -mt-12 border-4 border-orange-300">
              {MOCK_LEADERBOARD[2].avatar}
            </div>
            <h3 className="font-bold text-slate-900 mt-4">{MOCK_LEADERBOARD[2].name}</h3>
            <p className="text-xl font-black text-orange-700 mt-2">{MOCK_LEADERBOARD[2].xp.toLocaleString()} XP</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-orange-600">
              <Flame className="w-4 h-4" />
              <span>{MOCK_LEADERBOARD[2].streak} day streak</span>
            </div>
          </div>
          <div className="bg-orange-200 h-6 rounded-b-xl flex items-center justify-center">
            <span className="text-sm font-bold text-orange-700">#3</span>
          </div>
        </div>
      </motion.div>

      {/* Your Position Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`p-6 rounded-2xl flex items-center justify-between ${isCandidate ? 'bg-amber-50 border border-amber-200' : 'bg-indigo-50 border border-indigo-200'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${isCandidate ? 'bg-amber-200 text-amber-700' : 'bg-indigo-200 text-indigo-700'}`}>
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <p className="font-bold text-slate-900">Your Position</p>
            <p className="text-sm text-slate-500">Keep practicing to climb the ranks!</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-slate-900">#{USER_RANK}</p>
          <p className="text-sm text-slate-500">{USER_XP.toLocaleString()} XP</p>
        </div>
      </motion.div>

      {/* Leaderboard Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            Top Learners
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {MOCK_LEADERBOARD.map((student, i) => (
            <div 
              key={i} 
              className={`p-4 flex items-center justify-between hover:bg-slate-50 ${student.rank === USER_RANK ? (isCandidate ? 'bg-amber-50' : 'bg-indigo-50') : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRankColor(student.rank)} border`}>
                  {getRankIcon(student.rank) || student.rank}
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${Number(student.grade) === 6 || Number(student.grade) === 9 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  {student.avatar}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{student.name}</p>
                  <p className="text-sm text-slate-500">Grade {student.grade}</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-orange-500 font-bold">
                    <Flame className="w-4 h-4 fill-orange-500" />
                    {student.streak}
                  </div>
                  <p className="text-xs text-slate-500">Streak</p>
                </div>
                <div className="text-center min-w-[80px]">
                  <p className="font-black text-slate-900">{student.xp.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">XP</p>
                </div>
                <div className="text-green-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-slate-700">Your Goal</span>
          </div>
          <p className="text-2xl font-black text-slate-900">Reach Top 5</p>
          <p className="text-sm text-slate-500 mt-1">1,500 XP to go</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-slate-700">This Week</span>
          </div>
          <p className="text-2xl font-black text-slate-900">+450 XP</p>
          <p className="text-sm text-green-600 mt-1">↑ 2 positions</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-slate-700">Badges Earned</span>
          </div>
          <p className="text-2xl font-black text-slate-900">8</p>
          <p className="text-sm text-slate-500 mt-1">2 this month</p>
        </motion.div>
      </div>
    </div>
  );
}