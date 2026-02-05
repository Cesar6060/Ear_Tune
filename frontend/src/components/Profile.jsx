// src/components/Profile.jsx - User profile dashboard with gamification stats
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Flame, Target, TrendingUp, Award } from 'lucide-react';
import axios from '../axiosConfig';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/v1/profile/')
      .then(response => {
        setProfile(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
        setError('Failed to load profile. Please try again later.');
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen"
    >
      <div className="text-xl text-indigo-600">Loading profile...</div>
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

  if (!profile) return null;

  // Calculate XP progress percentage
  const xpProgress = (profile.current_xp / profile.xp_for_next_level) * 100;

  // Calculate accuracy percentage
  const accuracy = profile.total_games_played > 0
    ? ((profile.total_correct_answers / profile.total_games_played) * 100).toFixed(1)
    : 0;

  // Calculate circular progress for level ring (0-360 degrees)
  const levelProgress = (profile.current_xp / profile.xp_for_next_level) * 360;

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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="profile-container min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 px-4 py-12"
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
      >
        Your Profile
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-center text-lg text-slate-700 mb-12"
      >
        Track your progress and achievements
      </motion.p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        {/* Level Card with Circular Progress */}
        <motion.div
          variants={cardVariants}
          className="level-card bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-indigo-100 p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Circular Level Progress */}
            <div className="relative flex items-center justify-center">
              <svg className="transform -rotate-90" width="200" height="200">
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="#e0e7ff"
                  strokeWidth="12"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 85}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 85 - (levelProgress / 360) * (2 * Math.PI * 85)
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="50%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Trophy className="w-12 h-12 text-indigo-600 mb-2" />
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {profile.level}
                </div>
                <div className="text-sm text-slate-600 font-semibold">Level</div>
              </div>
            </div>

            {/* XP Info */}
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-slate-700">Experience Points</span>
                <span className="text-sm font-medium text-indigo-600">
                  {profile.current_xp} / {profile.xp_for_next_level} XP
                </span>
              </div>
              <div className="w-full h-6 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
              <div className="mt-4 text-sm text-slate-600">
                <Star className="inline w-4 h-4 mr-1 text-yellow-500" />
                <span className="font-medium">{profile.xp_for_next_level - profile.current_xp} XP</span> needed for next level
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Streak Card */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -8 }}
            className="stat-card bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-orange-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Flame className="w-10 h-10 text-orange-500" />
              <div className="text-4xl font-bold text-orange-600">
                {profile.current_streak}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Current Streak</h3>
            <p className="text-sm text-slate-600 mt-1">Days in a row</p>
          </motion.div>

          {/* Games Played Card */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -8 }}
            className="stat-card bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-10 h-10 text-blue-500" />
              <div className="text-4xl font-bold text-blue-600">
                {profile.total_games_played}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Total Games</h3>
            <p className="text-sm text-slate-600 mt-1">Games played</p>
          </motion.div>

          {/* Correct Answers Card */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -8 }}
            className="stat-card bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-green-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Award className="w-10 h-10 text-green-500" />
              <div className="text-4xl font-bold text-green-600">
                {profile.total_correct_answers}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Correct Answers</h3>
            <p className="text-sm text-slate-600 mt-1">All time</p>
          </motion.div>

          {/* Accuracy Card */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -8 }}
            className="stat-card bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-purple-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-10 h-10 text-purple-500" />
              <div className="text-4xl font-bold text-purple-600">
                {accuracy}%
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Accuracy</h3>
            <p className="text-sm text-slate-600 mt-1">Success rate</p>
          </motion.div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          variants={cardVariants}
          className="info-card bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-100 p-6 mt-6"
        >
          <h3 className="text-xl font-bold text-slate-800 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Username</p>
              <p className="text-lg font-semibold text-slate-800">{profile.username}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Member Since</p>
              <p className="text-lg font-semibold text-slate-800">
                {new Date(profile.date_joined).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default Profile;
