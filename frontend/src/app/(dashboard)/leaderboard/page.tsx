'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Star,
  TrendingUp,
  Target,
  Users,
  Swords,
  Loader2,
  Clock,
  Zap,
  Award,
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar?: string;
  xpPoints: number;
  level: number;
  streakDays?: number;
  grade?: number;
}

interface Tournament {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  subjectId?: string;
  grade?: number;
  questionCount: number;
  durationMinutes: number;
  participantCount?: number;
}

interface UserStats {
  totalSessions?: number;
  totalQuestions?: number;
  totalCorrect?: number;
  totalTimeMinutes?: number;
  averageScore?: number;
  successRate?: number;
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [badgeCount, setBadgeCount] = useState(0);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    fetchLeaderboard();
    fetchTournaments();
    fetchBadges();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [typeFilter, timeFilter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const grade = Number(user?.grade);
      const isGradeFilter = typeFilter === 'your-grade' && grade;
      const limit = 50;

      const url = isGradeFilter
        ? `/gamification/leaderboard/grade/${grade}?limit=${limit}`
        : `/gamification/leaderboard/global?limit=${limit}`;

      const res = await api.get(url);
      const data = res.data || [];

      const entries = data.map((entry: any, index: number) => ({
        ...entry,
        rank: entry.rank || index + 1,
      }));

      setLeaderboard(entries);

      if (user) {
        const myEntry = entries.find((e: LeaderboardEntry) => e.userId === user.id);
        if (myEntry) {
          setUserRank(myEntry);
        } else if (data.length > 0) {
          setUserRank({ rank: data.length + 1, userId: user.id, userName: `${user.firstName} ${user.lastName}`, xpPoints: 0, level: 1 });
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/gamification/tournaments/active');
      setTournaments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tournaments', err);
    }
  };

  const fetchBadges = async () => {
    try {
      const res = await api.get('/gamification/badges');
      setBadgeCount((res.data || []).length);
    } catch (err) {
      // Onboarding may not be complete
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics/stats');
      setStats(res.data);
    } catch (err) {
      // Stats not available
    }
  };

  const joinTournament = async (tournamentId: string) => {
    try {
      await api.post(`/gamification/tournaments/${tournamentId}/join`);
      fetchTournaments();
    } catch (err: any) {
      console.error('Failed to join tournament', err);
    }
  };

  if (!user) return null;

  const isCandidate = Number(user.grade) === 6 || Number(user.grade) === 9;

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

  const top3 = leaderboard.slice(0, 3);

  const xpToNextRank = userRank && leaderboard.length > 0 && userRank.rank > 1
    ? (leaderboard[userRank.rank - 2]?.xpPoints || 0) - userRank.xpPoints
    : 0;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
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

        <div className="flex gap-3">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Time</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Grades</option>
            <option value="your-grade">Your Grade</option>
            <option value="candidates">Candidates Only</option>
          </select>
        </div>
      </div>

      {/* Active Tournaments */}
      {tournaments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Swords className="w-5 h-5 text-amber-500" />
            Active Challenges & Tournaments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-200/50 px-2.5 py-1 rounded-full">
                    {tournament.type.replace('_', ' ')}
                  </span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{tournament.name}</h3>
                {tournament.description && (
                  <p className="text-sm text-slate-600 mb-3">{tournament.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(tournament.startTime)} - {formatTime(tournament.endTime)}
                  </span>
                  <span>{tournament.questionCount} questions</span>
                  <span>{tournament.durationMinutes} min</span>
                </div>
                <button
                  onClick={() => joinTournament(tournament.id)}
                  className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition"
                >
                  Join Challenge
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top 3 Podium */}
      {!loading && top3.length >= 3 && (
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
                {top3[1]?.userName?.split(' ').map((n: string) => n[0]).join('') || '?'}
              </div>
              <h3 className="font-bold text-slate-900 mt-4">{top3[1]?.userName || 'Unknown'}</h3>
              <p className="text-2xl font-black text-slate-600 mt-2">{(top3[1]?.xpPoints || 0).toLocaleString()} XP</p>
              {top3[1]?.streakDays && top3[1].streakDays > 0 && (
                <div className="flex items-center justify-center gap-2 mt-2 text-slate-500">
                  <Flame className="w-4 h-4" />
                  <span>{top3[1].streakDays} day streak</span>
                </div>
              )}
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
                {top3[0]?.userName?.split(' ').map((n: string) => n[0]).join('') || '?'}
              </div>
              <h3 className="font-bold text-slate-900 mt-4 text-lg">{top3[0]?.userName || 'Unknown'}</h3>
              <p className="text-3xl font-black text-amber-600 mt-2">{(top3[0]?.xpPoints || 0).toLocaleString()} XP</p>
              {top3[0]?.streakDays && top3[0].streakDays > 0 && (
                <div className="flex items-center justify-center gap-2 mt-2 text-amber-700">
                  <Flame className="w-4 h-4 fill-amber-500" />
                  <span className="font-semibold">{top3[0].streakDays} day streak</span>
                </div>
              )}
            </div>
            <div className="bg-gradient-to-b from-amber-300 to-amber-400 h-12 rounded-b-xl flex items-center justify-center shadow-lg">
              <Trophy className="w-6 h-6 text-amber-700" />
            </div>
          </div>

          {/* 3rd Place */}
          <div className="order-3">
            <div className="bg-orange-50 rounded-t-3xl p-6 text-center border-4 border-orange-300 border-b-0">
              <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center font-bold text-xl text-orange-700 mx-auto -mt-12 border-4 border-orange-300">
                {top3[2]?.userName?.split(' ').map((n: string) => n[0]).join('') || '?'}
              </div>
              <h3 className="font-bold text-slate-900 mt-4">{top3[2]?.userName || 'Unknown'}</h3>
              <p className="text-xl font-black text-orange-700 mt-2">{(top3[2]?.xpPoints || 0).toLocaleString()} XP</p>
              {top3[2]?.streakDays && top3[2].streakDays > 0 && (
                <div className="flex items-center justify-center gap-2 mt-2 text-orange-600">
                  <Flame className="w-4 h-4" />
                  <span>{top3[2].streakDays} day streak</span>
                </div>
              )}
            </div>
            <div className="bg-orange-200 h-6 rounded-b-xl flex items-center justify-center">
              <span className="text-sm font-bold text-orange-700">#3</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Your Position Banner */}
      {userRank && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-2xl flex items-center justify-between ${isCandidate ? 'bg-amber-50 border border-amber-200' : 'bg-indigo-50 border border-indigo-200'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${isCandidate ? 'bg-amber-200 text-amber-700' : 'bg-indigo-200 text-indigo-700'}`}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <p className="font-bold text-slate-900">Your Position</p>
              <p className="text-sm text-slate-500">Level {userRank.level} &middot; Keep practicing to climb the ranks!</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-900">#{userRank.rank}</p>
            <p className="text-sm text-slate-500">{userRank.xpPoints.toLocaleString()} XP</p>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Table */}
      {!loading && (
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
            {leaderboard.map((entry, i) => (
              <div
                key={entry.userId || i}
                className={`p-4 flex items-center justify-between hover:bg-slate-50 ${entry.userId === user.id ? (isCandidate ? 'bg-amber-50' : 'bg-indigo-50') : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRankColor(entry.rank)} border`}>
                    {getRankIcon(entry.rank) || entry.rank}
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${entry.userId === user.id ? (isCandidate ? 'bg-amber-200 text-amber-700' : 'bg-indigo-200 text-indigo-700') : (isCandidate ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}`}>
                    {entry.userName?.split(' ').map((n: string) => n[0]).join('') || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {entry.userName || 'Unknown'}
                      {entry.userId === user.id && <span className="text-xs text-slate-400 ml-2">(You)</span>}
                    </p>
                    <p className="text-sm text-slate-500">Level {entry.level}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {entry.streakDays && entry.streakDays > 0 && (
                    <div className="text-center hidden sm:block">
                      <div className="flex items-center gap-1 text-orange-500 font-bold">
                        <Flame className="w-4 h-4 fill-orange-500" />
                        {entry.streakDays}
                      </div>
                      <p className="text-xs text-slate-500">Streak</p>
                    </div>
                  )}
                  <div className="text-center min-w-[80px]">
                    <p className="font-black text-slate-900">{entry.xpPoints.toLocaleString()}</p>
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
      )}

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
          <p className="text-2xl font-black text-slate-900">
            {xpToNextRank > 0 ? `Reach #${(userRank?.rank || 1) - 1}` : 'Top of the Class!'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {xpToNextRank > 0 ? `${xpToNextRank.toLocaleString()} XP to next rank` : 'Amazing work!'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-slate-700">Your Practice</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {stats?.totalSessions || 0} {stats?.totalSessions === 1 ? 'Session' : 'Sessions'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {stats?.totalQuestions || 0} questions &middot; {stats?.totalCorrect || 0} correct
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-slate-700">Badges Earned</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{badgeCount}</p>
          <p className="text-sm text-slate-500 mt-1">{userRank?.level ? `Level ${userRank.level} Learner` : 'Start practicing to earn badges'}</p>
        </motion.div>
      </div>
    </div>
  );
}