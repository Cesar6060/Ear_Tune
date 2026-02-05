// src/components/NavBar.jsx - Navigation bar component
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';


function NavBar({ isAuthenticated, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="navbar bg-white/90 backdrop-blur-lg shadow-lg border-b border-slate-200 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="logo"
        >
          <Link
            to="/"
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            EarTune
          </Link>
        </motion.div>
        <div className="nav-links flex gap-4 items-center">
          {isAuthenticated ? (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    isActive('/')
                      ? 'text-white'
                      : 'text-slate-700 hover:text-indigo-600'
                  }`}
                >
                  Games
                  {isActive('/') && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="logout-btn bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                Logout
              </motion.button>
            </>
          ) : (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    isActive('/login')
                      ? 'text-white'
                      : 'text-slate-700 hover:text-indigo-600'
                  }`}
                >
                  Login
                  {isActive('/login') && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    isActive('/register')
                      ? 'text-white'
                      : 'text-slate-700 hover:text-indigo-600'
                  }`}
                >
                  Register
                  {isActive('/register') && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

export default NavBar;