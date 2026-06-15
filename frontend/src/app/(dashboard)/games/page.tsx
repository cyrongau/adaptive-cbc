'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Trophy, Medal, Star, Sparkles, Brain, Clock, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function GameHub() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('study-games');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeGame, setActiveGame] = useState<any>(null);
  const [gameScore, setGameScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [tournaments, setTournaments] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (activeTab === 'tournaments') fetchTournaments();
    if (activeTab === 'leaderboard') fetchLeaderboard();
  }, [activeTab]);

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/gamification/tournaments/active');
      setTournaments(res.data);
    } catch (e) {
      toast.error('Failed to load tournaments');
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/gamification/leaderboard/global');
      setLeaderboard(res.data);
    } catch (e) {
      toast.error('Failed to load leaderboard');
    }
  };

  const generateGame = async (subject: string) => {
    setIsGenerating(true);
    try {
      const res = await api.post('/gamification/games/generate', {
        subject,
        grade: user?.grade || 5,
      });
      setActiveGame(res.data);
      setGameScore(0);
      setCurrentQuestionIndex(0);
    } catch (e) {
      toast.error('Failed to generate game');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = async (selected: string, correct: string) => {
    if (selected === correct) {
      setGameScore((prev) => prev + 10);
      toast.success('+10 XP!', { icon: '⭐️' });
    } else {
      toast.error('Incorrect!');
    }

    if (currentQuestionIndex < activeGame.questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex((prev) => prev + 1), 1000);
    } else {
      setTimeout(() => submitGame(), 1000);
    }
  };

  const submitGame = async () => {
    try {
      await api.post('/gamification/games/score', { score: gameScore });
      toast.success(`Game Complete! You earned ${gameScore} XP!`, { duration: 4000 });
      setActiveGame(null);
    } catch (e) {
      toast.error('Failed to save score');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
              <Gamepad2 className="w-10 h-10" />
              Game Hub
            </h1>
            <p className="text-indigo-100 text-lg max-w-xl">
              Sharpen your mind with AI-generated study games, join tournaments, and climb the leaderboard!
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-indigo-100 font-medium text-sm mb-1 uppercase tracking-wider">Your XP</p>
            <p className="text-4xl font-black text-yellow-300 drop-shadow-sm flex items-center gap-2">
              <Star className="w-8 h-8 fill-yellow-300" />
              {user?.xpPoints || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 border-b border-slate-200 pb-2">
        {['study-games', 'tournaments', 'leaderboard'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-t-xl font-bold transition-all ${
              activeTab === tab
                ? 'bg-white text-violet-600 border-t-2 border-l-2 border-r-2 border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] translate-y-0.5'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Active Game Overlay */}
      <AnimatePresence>
        {activeGame && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="bg-indigo-600 p-6 text-white text-center relative">
                <h2 className="text-2xl font-bold">{activeGame.title}</h2>
                <button 
                  onClick={() => setActiveGame(null)}
                  className="absolute top-6 right-6 text-indigo-200 hover:text-white transition-colors font-bold"
                >
                  Quit
                </button>
              </div>
              <div className="p-8 flex-1">
                <div className="mb-8">
                  <span className="text-sm font-bold text-indigo-500 uppercase tracking-wider">
                    Question {currentQuestionIndex + 1} of {activeGame.questions.length}
                  </span>
                  <h3 className="text-xl font-semibold text-slate-800 mt-2">
                    {activeGame.questions[currentQuestionIndex].prompt}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {activeGame.questions[currentQuestionIndex].options?.map((opt: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt, activeGame.questions[currentQuestionIndex].correctAnswer)}
                      className="w-full p-4 border-2 border-slate-100 rounded-xl text-left hover:border-indigo-400 hover:bg-indigo-50 font-medium text-slate-700 transition-all active:scale-[0.98]"
                    >
                      {opt}
                    </button>
                  ))}
                  {/* For non-trivia games (placeholder for input) */}
                  {!activeGame.questions[currentQuestionIndex].options && (
                     <div className="flex gap-3">
                       <input type="text" className="flex-1 p-4 border-2 border-slate-200 rounded-xl" placeholder="Type your answer..." id="game-input" />
                       <button 
                        onClick={() => {
                          const val = (document.getElementById('game-input') as HTMLInputElement).value;
                          handleAnswer(val, activeGame.questions[currentQuestionIndex].correctAnswer);
                        }}
                        className="bg-indigo-600 text-white px-8 rounded-xl font-bold"
                       >
                         Submit
                       </button>
                     </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 min-h-[500px]">
        {activeTab === 'study-games' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">AI Brain Builder</h2>
              <p className="text-slate-500">
                Generate a custom mini-game based on what you're learning. Earn XP while reinforcing your knowledge!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              {['Mathematics', 'Science', 'English'].map((sub) => (
                <button
                  key={sub}
                  disabled={isGenerating}
                  onClick={() => generateGame(sub)}
                  className="group relative overflow-hidden bg-slate-50 border-2 border-slate-100 hover:border-violet-300 rounded-2xl p-6 transition-all hover:shadow-lg disabled:opacity-50 text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-violet-500/5 group-hover:to-violet-500/10 transition-colors"></div>
                  <Sparkles className="w-8 h-8 text-violet-400 mb-4" />
                  <h3 className="font-bold text-xl text-slate-800 mb-1">{sub} Game</h3>
                  <p className="text-sm text-slate-500">Generate a custom {sub.toLowerCase()} challenge.</p>
                </button>
              ))}
            </div>
            
            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12 text-violet-600">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4"></div>
                <p className="font-bold animate-pulse">AI is crafting your game...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Trophy className="text-yellow-500" /> Active Tournaments</h2>
            {tournaments.length === 0 ? (
              <div className="text-center py-16 text-slate-500 border-2 border-dashed rounded-2xl">
                No active tournaments right now. Check back later!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournaments.map((t: any) => (
                  <div key={t.id} className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
                    <h3 className="font-bold text-lg mb-2">{t.title}</h3>
                    <p className="text-slate-600 text-sm mb-4">{t.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Closes soon
                      </span>
                      <button className="bg-slate-900 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors">
                        Join Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold flex items-center gap-2"><Medal className="text-blue-500" /> Global Top Students</h2>
             <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
               <table className="w-full text-left">
                 <thead className="bg-slate-100 text-slate-500 text-sm font-bold uppercase tracking-wider">
                   <tr>
                     <th className="px-6 py-4">Rank</th>
                     <th className="px-6 py-4">Student</th>
                     <th className="px-6 py-4 text-right">XP Points</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                   {leaderboard.length === 0 ? (
                     <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Loading leaderboard...</td></tr>
                   ) : leaderboard.map((l: any, i: number) => (
                     <tr key={i} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 font-black text-slate-400">
                         {i === 0 ? <span className="text-yellow-500 text-2xl">#1</span> : 
                          i === 1 ? <span className="text-slate-400 text-xl">#2</span> :
                          i === 2 ? <span className="text-amber-600 text-lg">#3</span> : 
                          `#${i + 1}`}
                       </td>
                       <td className="px-6 py-4 font-bold text-slate-800">{l.userName}</td>
                       <td className="px-6 py-4 text-right font-black text-indigo-600 flex justify-end items-center gap-1">
                         {l.xpPoints} <Star className="w-4 h-4 fill-indigo-600" />
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
