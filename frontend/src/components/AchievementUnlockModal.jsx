// src/components/AchievementUnlockModal.jsx - Modal for achievement unlock celebration
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

function AchievementUnlockModal({ achievement, onClose }) {
  useEffect(() => {
    if (achievement) {
      // Trigger confetti celebration
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{
            scale: 1,
            rotate: 0,
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.6
            }
          }}
          exit={{ scale: 0, rotate: 180, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Achievement Unlocked header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Achievement Unlocked!
              </h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-yellow-500">⭐</span>
                <span className="text-yellow-500">⭐</span>
                <span className="text-yellow-500">⭐</span>
              </div>
            </motion.div>

            {/* Large achievement icon with pulse animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
                rotate: [0, -10, 10, -10, 10, 0],
              }}
              transition={{
                scale: { delay: 0.3, type: "spring", stiffness: 200 },
                rotate: { delay: 0.5, duration: 0.5 }
              }}
              className="text-9xl mb-6"
            >
              {achievement.icon || '🏆'}
            </motion.div>

            {/* Achievement name */}
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-slate-800 mb-3"
            >
              {achievement.name}
            </motion.h3>

            {/* Achievement description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-slate-600 mb-6"
            >
              {achievement.description}
            </motion.p>

            {/* XP reward with shine effect */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full blur-xl opacity-50" />
              <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full shadow-xl">
                <span className="text-3xl font-bold">+{achievement.xp_reward} XP</span>
              </div>
            </motion.div>

            {/* Sparkle effects */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-8 left-8 text-yellow-400 text-2xl"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-12 right-12 text-yellow-400 text-3xl"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute bottom-12 left-12 text-yellow-400 text-2xl"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute bottom-8 right-8 text-yellow-400 text-xl"
            >
              ✨
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AchievementUnlockModal;
