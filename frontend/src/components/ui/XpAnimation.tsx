'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
}

interface XpAnimationProps {
  xpAmount: number;
  isCorrect: boolean;
  isFirstAttempt: boolean;
  onComplete?: () => void;
}

const COLORS = {
  correct: ['#22c55e', '#16a34a', '#4ade80', '#86efac'],
  firstAttempt: ['#f59e0b', '#eab308', '#fbbf24', '#fcd34d'],
  bonus: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed'],
};

export default function XpAnimation({ xpAmount, isCorrect, isFirstAttempt, onComplete }: XpAnimationProps) {
  const [show, setShow] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (xpAmount <= 0) {
      setShow(false);
      onComplete?.();
      return;
    }

    const newParticles: Particle[] = [];
    const colors = isFirstAttempt
      ? [...COLORS.correct, ...COLORS.bonus]
      : COLORS.correct;

    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: i,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
      });
    }
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [xpAmount, isFirstAttempt, onComplete]);

  if (xpAmount <= 0) return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {/* XP badge */}
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0, y: -60 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative"
          >
            <div className={`
              px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3
              ${isFirstAttempt
                ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-emerald-500 to-green-500'}
            `}>
              <motion.span
                animate={{ rotate: [0, -10, 10, -5, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl"
              >
                {isFirstAttempt ? '⭐' : '✅'}
              </motion.span>
              <div className="text-left">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                  className="text-3xl font-black text-white tracking-tight"
                >
                  +{xpAmount} XP
                </motion.div>
                {isFirstAttempt && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xs font-bold text-yellow-100"
                  >
                    First Attempt Bonus!
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: [1, 1, 0],
                scale: [1, 0.5, 0],
                rotate: p.rotation,
              }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
