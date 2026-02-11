// src/components/NavBar.jsx - Navigation bar component
import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../axiosConfig';

function NavBar({ isAuthenticated, onLogout }) {
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Fetch user profile if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      axios.get('/api/v1/profile/')
        .then(response => {
          setProfile(response.data);
        })
        .catch(error => {
          console.error("Error fetching profile:", error);
        });
    }
  }, [isAuthenticated, location.pathname]);

  // Close dropdown when navigating to different page
  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Calculate XP percentage
  const xpPercentage = profile && profile.xp_for_next_level > 0
    ? Math.min((profile.current_xp / profile.xp_for_next_level) * 100, 100)
    : 0;

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/95 backdrop-blur-xl shadow-md border-b border-indigo-100/50 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            🎵 EarTune
          </Link>

          {/* Navigation */}
          {isAuthenticated ? (
            <div className="flex items-center gap-6">
              {/* Main Nav Links */}
              <div className="flex items-center gap-1">
                <NavLink to="/" isActive={isActive('/')}>
                  Games
                </NavLink>
                <NavLink to="/achievements" isActive={isActive('/achievements')}>
                  🏆 Achievements
                </NavLink>
              </div>

              {/* User Profile Section */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 px-4 py-2 rounded-xl border border-indigo-200/50 transition-all"
                >
                  {/* Level Badge */}
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                      Lv {profile?.level || 1}
                    </div>

                    {/* Compact XP Bar */}
                    <div className="flex flex-col gap-1">
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${xpPercentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {profile?.current_xp || 0} / {profile?.xp_for_next_level || 100} XP
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Icon */}
                  <svg
                    className={`w-4 h-4 text-slate-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors font-medium"
                      >
                        👤 Profile
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-slate-100"
                      >
                        🚪 Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2 text-slate-700 hover:text-indigo-600 font-semibold transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

// Reusable Nav Link Component
function NavLink({ to, isActive, children }) {
  return (
    <Link
      to={to}
      className={`relative px-4 py-2 rounded-lg font-semibold transition-all ${
        isActive
          ? 'text-white'
          : 'text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50'
      }`}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg -z-10"
          initial={false}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

export default NavBar;