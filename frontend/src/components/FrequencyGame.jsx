import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import axios from '../axiosConfig';
import LevelUpModal from './LevelUpModal';
import AchievementUnlockModal from './AchievementUnlockModal';

function FrequencyGame() {
  const navigate = useNavigate();
  
  // State
  const [challenge, setChallenge] = useState(null);
  const [frequencyBands, setFrequencyBands] = useState([]);
  const [selectedBand, setSelectedBand] = useState(null);
  const [selectedChange, setSelectedChange] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [difficulty, setDifficulty] = useState('beginner');
  const [loading, setLoading] = useState(true);
  
  // Audio refs
  const originalAudioRef = useRef(null);
  const processedAudioRef = useRef(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Gamification state
  const [xpEarned, setXpEarned] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(null);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [achievementQueue, setAchievementQueue] = useState([]);

  // Update window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Load frequency bands on mount
  useEffect(() => {
    loadFrequencyBands();
    loadNewChallenge();
  }, [difficulty]);
  
  const loadFrequencyBands = async () => {
    try {
      const response = await axios.get('/api/v1/frequency-bands/');
      setFrequencyBands(response.data);
    } catch (error) {
      console.error('Error loading frequency bands:', error);
    }
  };
  
  const loadNewChallenge = async () => {
    setLoading(true);
    setFeedback(null);
    setSelectedBand(null);
    setSelectedChange(null);
    
    try {
      const response = await axios.get('/api/v1/eq-challenge/random/', {
        params: { difficulty }
      });
      setChallenge(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading challenge:', error);
      setLoading(false);
    }
  };
  
  const playOriginal = () => {
    if (processedAudioRef.current) {
      processedAudioRef.current.pause();
    }
    originalAudioRef.current.play();
    setCurrentlyPlaying('original');
  };
  
  const playProcessed = () => {
    if (originalAudioRef.current) {
      originalAudioRef.current.pause();
    }
    processedAudioRef.current.play();
    setCurrentlyPlaying('processed');
  };
  
  const submitAnswer = async () => {
    if (!selectedBand || selectedChange === null) {
      alert('Please select both a frequency band and change amount');
      return;
    }

    try {
      const response = await axios.post('/api/v1/eq-challenge/submit/', {
        challenge_id: challenge.id,
        frequency_band_id: selectedBand,
        change_amount: selectedChange
      });

      const { correct, correct_answer, xp_earned, level_up, new_level, unlocked_achievements } = response.data;

      setFeedback({
        correct,
        correctAnswer: correct_answer,
        message: correct ? 'Correct! Well done!' : 'Incorrect. Try again!'
      });

      setAttempts(attempts + 1);
      if (correct) {
        setScore(score + 1);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);

        // Show XP earned
        if (xp_earned) {
          setXpEarned(xp_earned);
          setTimeout(() => setXpEarned(0), 3000);
        }

        // Show level up modal
        if (level_up && new_level) {
          setTimeout(() => {
            setNewLevel(new_level);
            setShowLevelUp(true);
          }, 1000);
        }

        // Queue achievements to show one by one
        if (unlocked_achievements && unlocked_achievements.length > 0) {
          setTimeout(() => {
            setAchievementQueue(unlocked_achievements);
          }, level_up ? 4000 : 2000);
        }

        setTimeout(loadNewChallenge, 2000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  // Handle achievement queue display
  useEffect(() => {
    if (achievementQueue.length > 0 && !currentAchievement) {
      setCurrentAchievement(achievementQueue[0]);
    }
  }, [achievementQueue, currentAchievement]);

  const handleAchievementClose = () => {
    setCurrentAchievement(null);
    setAchievementQueue(prev => prev.slice(1));
  };

  const handleLevelUpClose = () => {
    setShowLevelUp(false);
    setNewLevel(null);
  };
  
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen"
      >
        <div className="text-xl text-indigo-600">Loading challenge...</div>
      </motion.div>
    );
  }

  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="frequency-game-container min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 px-4 py-8"
    >
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={200}
          recycle={false}
          gravity={0.3}
        />
      )}

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
      >
        Frequency Recognition Training
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="game-stats flex justify-center gap-8 mb-6"
      >
        <motion.div
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="bg-white/80 backdrop-blur-lg px-6 py-3 rounded-full shadow-lg border border-indigo-200"
        >
          <span className="text-lg font-bold text-slate-700">Score: </span>
          <span className="text-lg font-bold text-indigo-600">{score}/{attempts}</span>
          {attempts > 0 && <span className="text-sm text-slate-500 ml-2">({accuracy}%)</span>}
        </motion.div>
        <div className="bg-white/80 backdrop-blur-lg px-6 py-3 rounded-full shadow-lg border border-purple-200">
          <span className="text-lg font-semibold text-slate-700">Difficulty: </span>
          <span className="text-lg font-semibold text-purple-600 capitalize">{difficulty}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="difficulty-selector flex justify-center gap-3 mb-8"
      >
        {['beginner', 'intermediate', 'advanced'].map((level) => (
          <motion.button
            key={level}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              difficulty === level
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/80 text-slate-700 border border-slate-300 hover:border-indigo-400'
            }`}
            onClick={() => setDifficulty(level)}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="audio-controls max-w-2xl mx-auto bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-slate-200"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-slate-800">Listen and Compare</h2>
        <div className="audio-buttons flex justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={playOriginal}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              currentlyPlaying === 'original'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {currentlyPlaying === 'original' ? 'Playing Original...' : 'Play Original'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={playProcessed}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              currentlyPlaying === 'processed'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {currentlyPlaying === 'processed' ? 'Playing Modified...' : 'Play Modified'}
          </motion.button>
        </div>

        {challenge && (
          <>
            <audio
              ref={originalAudioRef}
              src={`/static/audio/eq_samples/${challenge.source_audio}`}
              onEnded={() => setCurrentlyPlaying(null)}
            />
            <audio
              ref={processedAudioRef}
              src={`/static/audio/eq_samples/${challenge.source_audio}_${challenge.frequency_band.name.toLowerCase().replaceAll(' ', '_')}_${challenge.change_amount}db.wav`}
              onEnded={() => setCurrentlyPlaying(null)}
            />
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="answer-section max-w-4xl mx-auto bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-slate-200"
      >
        <h3 className="text-xl font-bold mb-4 text-slate-800">Which frequency was changed?</h3>
        <div className="frequency-band-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {frequencyBands.map(band => (
            <motion.button
              key={band.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`freq-band-btn p-4 rounded-lg border-2 transition-all ${
                selectedBand === band.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-600 shadow-lg'
                  : 'bg-white border-slate-300 hover:border-indigo-400 text-slate-700'
              }`}
              onClick={() => setSelectedBand(band.id)}
            >
              <span className="band-name block font-bold text-sm">{band.name}</span>
              <span className="band-range block text-xs mt-1 opacity-90">{band.min_frequency}-{band.max_frequency} Hz</span>
            </motion.button>
          ))}
        </div>

        <h3 className="text-xl font-bold mb-4 text-slate-800">By how much?</h3>
        <div className="change-amount-grid grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 mb-6">
          {[-12, -9, -6, -3, 0, 3, 6, 9, 12].map(amount => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`change-btn py-3 px-2 rounded-lg font-bold transition-all ${
                selectedChange === amount
                  ? amount === 0
                    ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg'
                    : amount > 0
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                      : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
                  : 'bg-white border border-slate-300 hover:border-indigo-400 text-slate-700'
              }`}
              onClick={() => setSelectedChange(amount)}
            >
              {amount > 0 ? '+' : ''}{amount} dB
            </motion.button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: selectedBand && selectedChange !== null ? 1.02 : 1 }}
          whileTap={{ scale: selectedBand && selectedChange !== null ? 0.98 : 1 }}
          className={`submit-answer-btn w-full py-4 rounded-lg font-bold text-lg transition-all ${
            selectedBand && selectedChange !== null
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl cursor-pointer'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
          onClick={submitAnswer}
          disabled={!selectedBand || selectedChange === null}
        >
          Submit Answer
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              ...(feedback.correct && {
                rotate: [0, -2, 2, -2, 2, 0],
              })
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.4 }}
            className={`feedback max-w-2xl mx-auto rounded-2xl p-6 text-center shadow-2xl border-2 ${
              feedback.correct
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
            }`}
          >
            <motion.p
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-bold mb-2 ${
                feedback.correct ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {feedback.message}
            </motion.p>
            {!feedback.correct && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-red-700"
              >
                Correct answer: <span className="font-bold">{feedback.correctAnswer.frequency_band}</span>
                ({feedback.correctAnswer.change_amount > 0 ? '+' : ''}
                {feedback.correctAnswer.change_amount} dB)
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP Earned Display */}
      <AnimatePresence>
        {xpEarned > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.5 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", duration: 0.5 }
            }}
            exit={{
              opacity: 0,
              y: -100,
              scale: 0.5,
              transition: { duration: 0.3 }
            }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full shadow-2xl border-4 border-yellow-300">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-3xl font-bold"
              >
                +{xpEarned} XP
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Modal */}
      {showLevelUp && <LevelUpModal newLevel={newLevel} xpEarned={xpEarned} onClose={handleLevelUpClose} />}

      {/* Achievement Unlock Modal */}
      {currentAchievement && <AchievementUnlockModal achievement={currentAchievement} onClose={handleAchievementClose} />}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center mt-8"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="back-btn bg-gradient-to-r from-slate-500 to-slate-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          Back to Games
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default FrequencyGame;