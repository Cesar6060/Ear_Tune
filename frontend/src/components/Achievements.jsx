// src/components/Achievements.jsx - Achievements gallery with filter and animations
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../axiosConfig';

function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unlocked', 'locked'

  useEffect(() => {
    axios.get('/api/v1/achievements/')
      .then(response => {
        setAchievements(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching achievements:", error);
        setError('Failed to load achievements. Please try again later.');
        setLoading(false);
      });
  }, []);

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked') return achievement.unlocked;
    if (filter === 'locked') return !achievement.unlocked;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  if (loading) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen"
    >
      <div className="text-xl text-indigo-600">Loading achievements...</div>
    </motion.div>
  );

  if (error) return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-screen"
    >
      <div className="text-xl text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
    </motion.div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 px-4 py-12"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-6xl mx-auto mb-8"
      >
        <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Achievements
        </h1>
        <p className="text-center text-lg text-slate-700 mb-6">
          Unlock achievements by completing challenges and reaching milestones
        </p>

        {/* Progress bar */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-indigo-100 p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-700 font-semibold">Progress</span>
            <span className="text-indigo-600 font-bold text-lg">
              {unlockedCount} / {totalCount}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
            />
          </div>
        </div>

        {/* Filter buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center gap-3"
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'unlocked', label: 'Unlocked' },
            { key: 'locked', label: 'Locked' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                filter === key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-white/80 backdrop-blur-lg text-slate-700 hover:bg-white hover:shadow-md border border-indigo-100'
              }`}
            >
              {label}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Achievements grid */}
      {filteredAchievements.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredAchievements.map(achievement => (
            <motion.div
              key={achievement.id}
              variants={cardVariants}
              whileHover={achievement.unlocked ? {
                scale: 1.05,
                y: -8,
                transition: { duration: 0.2 }
              } : {}}
              className={`relative bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border p-6 transition-all ${
                achievement.unlocked
                  ? 'border-indigo-200 hover:shadow-2xl hover:border-indigo-300'
                  : 'border-slate-200 opacity-50 grayscale'
              }`}
            >
              {/* Glow effect for unlocked achievements */}
              {achievement.unlocked && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400/20 via-purple-400/20 to-pink-400/20 blur-xl" />
              )}

              <div className="relative">
                {/* Icon */}
                <div className={`text-6xl mb-4 text-center ${
                  achievement.unlocked ? 'animate-bounce-slow' : ''
                }`}>
                  {achievement.icon || '🏆'}
                </div>

                {/* Name */}
                <h3 className={`text-xl font-bold text-center mb-2 ${
                  achievement.unlocked ? 'text-slate-800' : 'text-slate-600'
                }`}>
                  {achievement.name}
                </h3>

                {/* Description */}
                <p className={`text-sm text-center mb-4 ${
                  achievement.unlocked ? 'text-slate-600' : 'text-slate-500'
                }`}>
                  {achievement.description}
                </p>

                {/* XP Reward */}
                <div className={`text-center font-semibold text-sm mb-3 ${
                  achievement.unlocked ? 'text-indigo-600' : 'text-slate-500'
                }`}>
                  +{achievement.xp_reward} XP
                </div>

                {/* Unlock date or locked status */}
                {achievement.unlocked ? (
                  achievement.unlocked_at && (
                    <div className="text-xs text-center text-slate-500 bg-slate-100 rounded-lg py-2 px-3">
                      Unlocked: {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </div>
                  )
                ) : (
                  <div className="text-xs text-center text-slate-500 bg-slate-100 rounded-lg py-2 px-3">
                    🔒 Locked
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-slate-600 text-lg mt-12"
        >
          No achievements found for this filter.
        </motion.div>
      )}
    </motion.div>
  );
}

export default Achievements;
