// src/components/LevelUpModal.jsx - Modal for level up celebration
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

function LevelUpModal({ newLevel, xpEarned, onClose }) {
  useEffect(() => {
    if (newLevel) {
      // Trigger confetti celebration
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 100 * (timeLeft / duration);

        confetti({
          particleCount,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
          zIndex: 9999
        });
        confetti({
          particleCount,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
          zIndex: 9999
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [newLevel]);

  if (!newLevel) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0, y: 100, opacity: 0 }}
          animate={{
            scale: 1,
            y: 0,
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 200,
              damping: 20,
              duration: 0.6
            }
          }}
          exit={{ scale: 0, y: -100, opacity: 0 }}
          className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl shadow-2xl p-12 max-w-lg w-full relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl"
            />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="text-center relative z-10">
            {/* Level Up header with animation */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                scale: [1, 1.1, 1],
              }}
              transition={{
                y: { duration: 0.5 },
                opacity: { duration: 0.5 },
                scale: { delay: 0.5, duration: 0.5 }
              }}
              className="mb-8"
            >
              <h2 className="text-6xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                LEVEL UP!
              </h2>
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="flex items-center justify-center gap-2 text-2xl"
              >
                <span>⚡</span>
                <span>⚡</span>
                <span>⚡</span>
              </motion.div>
            </motion.div>

            {/* Level number with glow */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: 1,
                rotate: 0,
              }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 150,
                damping: 15
              }}
              className="relative inline-block mb-8"
            >
              {/* Outer glow ring */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-2xl"
              />

              {/* Level circle */}
              <div className="relative bg-white rounded-full w-48 h-48 flex items-center justify-center shadow-2xl border-4 border-purple-300">
                <div className="text-center">
                  <div className="text-slate-500 text-lg font-semibold mb-1">Level</div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.6,
                      type: "spring",
                      stiffness: 200
                    }}
                    className="text-7xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                  >
                    {newLevel}
                  </motion.div>
                </div>
              </div>

              {/* Sparkle effects around the circle */}
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0"
              >
                <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-3xl">✨</span>
                <span className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-2xl">✨</span>
                <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-3xl">✨</span>
                <span className="absolute top-1/2 -left-2 transform -translate-y-1/2 text-2xl">✨</span>
              </motion.div>
            </motion.div>

            {/* XP earned (if provided) */}
            {xpEarned && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-6"
              >
                <div className="inline-block bg-white/80 backdrop-blur-lg rounded-full px-6 py-3 shadow-lg border border-purple-200">
                  <span className="text-purple-600 font-bold text-xl">+{xpEarned} XP Earned</span>
                </div>
              </motion.div>
            )}

            {/* Congratulations message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-slate-700 text-lg font-medium"
            >
              Congratulations! Keep up the great work!
            </motion.p>

            {/* Continue button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-12 rounded-full shadow-xl transition-all duration-200"
            >
              Continue
            </motion.button>
          </div>

          {/* Additional shine effects */}
          <motion.div
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default LevelUpModal;
