// src/components/XPBar.jsx - Small XP progress bar component
import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

function XPBar({ currentXP, xpForNextLevel, level }) {
  const xpProgress = (currentXP / xpForNextLevel) * 100;

  return (
    <div className="xp-bar-container flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-indigo-100">
      {/* Level Badge */}
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <span className="text-sm font-bold text-indigo-600">Lv {level}</span>
      </div>

      {/* XP Progress Bar */}
      <div className="flex-1 min-w-[100px]">
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="text-xs text-slate-600 mt-1 text-center">
          {currentXP} / {xpForNextLevel} XP
        </div>
      </div>
    </div>
  );
}

export default XPBar;
