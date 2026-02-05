// src/components/Home.jsx - Home page displaying available games
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../axiosConfig';

function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/v1/games/')
      .then(response => {
        setGames(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching games:", error);
        setError('Failed to load games. Please try again later.');
        setLoading(false);
      });
  }, []);
  
  const getGamePath = (game) => {
    if (game.name === 'Frequency Recognition') {
      return '/frequency-game';
    }
    return `/game/${game.id}`;
  };

  if (loading) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen"
    >
      <div className="text-xl text-indigo-600">Loading games...</div>
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
        staggerChildren: 0.15
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
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
      className="home-container min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 px-4 py-12"
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
      >
        Welcome to EarTune!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="home-description text-center text-lg text-slate-700 mb-12 max-w-2xl mx-auto"
      >
        Improve your ear for music with interactive training games.
        Select a game below to begin your practice.
      </motion.p>
      {games.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="games-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {games.map(game => (
            <motion.div
              key={game.id}
              variants={cardVariants}
              whileHover={{
                scale: 1.05,
                y: -8,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              className="game-card bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl hover:shadow-2xl border border-indigo-100 p-6 transition-all"
            >
              <h2 className="text-2xl font-bold mb-3 text-slate-800">{game.name}</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">{game.description}</p>
              <Link
                to={`/game/${game.id}`}
                className="start-button inline-block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Start Game
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="no-games text-center text-slate-600 text-lg"
        >
          No games available at the moment.
        </motion.p>
      )}
    </motion.div>
  );
}

export default Home;