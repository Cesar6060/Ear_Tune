import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import axios from '../axiosConfig';
import LevelUpModal from './LevelUpModal';
import AchievementUnlockModal from './AchievementUnlockModal';

// Simplified frequency bands
const FREQUENCY_BANDS = [
  { id: 'bass', name: 'Bass', centerHz: 150, color: 'from-red-500 to-rose-600', emoji: '🔴' },
  { id: 'low-mids', name: 'Low Mids', centerHz: 600, color: 'from-orange-500 to-amber-600', emoji: '🟠' },
  { id: 'mids', name: 'Mids', centerHz: 1500, color: 'from-yellow-500 to-amber-600', emoji: '🟡' },
  { id: 'high-mids', name: 'High Mids', centerHz: 4000, color: 'from-green-500 to-emerald-600', emoji: '🟢' },
  { id: 'treble', name: 'Treble', centerHz: 10000, color: 'from-blue-500 to-indigo-600', emoji: '🔵' }
];

// Difficulty settings
const DIFFICULTIES = {
  beginner: { changeDb: 12, xp: 10, label: 'Beginner' },
  intermediate: { changeDb: 6, xp: 20, label: 'Intermediate' },
  advanced: { changeDb: 3, xp: 30, label: 'Advanced' }
};

function FrequencyGame() {
  const navigate = useNavigate();

  // Game state
  const [difficulty, setDifficulty] = useState('beginner');
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [selectedBand, setSelectedBand] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [loading, setLoading] = useState(false);

  // Gamification state
  const [xpEarned, setXpEarned] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(null);
  const [achievementQueue, setAchievementQueue] = useState([]);
  const [currentAchievement, setCurrentAchievement] = useState(null);

  // Audio refs
  const audioContextRef = useRef(null);
  const noiseBufferRef = useRef(null);
  const sourceRef = useRef(null);

  // Initialize audio context
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      alert('Your browser does not support Web Audio API');
      return;
    }

    audioContextRef.current = new AudioContext();
    generatePinkNoise();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Generate pink noise buffer
  const generatePinkNoise = () => {
    if (!audioContextRef.current) return;

    const duration = 3; // seconds
    const sampleRate = audioContextRef.current.sampleRate;
    const buffer = audioContextRef.current.createBuffer(2, duration * sampleRate, sampleRate);

    // Simple pink noise generation
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < channelData.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        channelData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }

    noiseBufferRef.current = buffer;
  };

  // Generate new challenge - fetch from backend
  const generateChallenge = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/v1/eq-challenge/random/?difficulty=${difficulty}`);
      const challenge = response.data;

      // Map backend frequency band to our client-side bands
      const bandMap = {
        'Bass': FREQUENCY_BANDS[0],
        'Low Mids': FREQUENCY_BANDS[1],
        'Mids': FREQUENCY_BANDS[2],
        'High Mids': FREQUENCY_BANDS[3],
        'Treble': FREQUENCY_BANDS[4]
      };

      const correctBand = bandMap[challenge.frequency_band.name] || FREQUENCY_BANDS[0];

      setCurrentChallenge({
        id: challenge.id,
        correctBand: correctBand,
        changeDb: challenge.change_amount,
        centerHz: correctBand.centerHz,
        frequencyBandId: challenge.frequency_band.id
      });
      setSelectedBand(null);
      setFeedback(null);
    } catch (error) {
      console.error('Error fetching challenge:', error);
      // Fallback to client-side generation if API fails
      const randomBand = FREQUENCY_BANDS[Math.floor(Math.random() * FREQUENCY_BANDS.length)];
      const isBoost = Math.random() > 0.5;
      const changeDb = isBoost ? DIFFICULTIES[difficulty].changeDb : -DIFFICULTIES[difficulty].changeDb;

      setCurrentChallenge({
        correctBand: randomBand,
        changeDb: changeDb,
        centerHz: randomBand.centerHz
      });
      setSelectedBand(null);
      setFeedback(null);
    } finally {
      setLoading(false);
    }
  };

  // Play audio
  const playAudio = (withFilter = false) => {
    if (!audioContextRef.current || !noiseBufferRef.current) return;

    // Stop any currently playing audio
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = noiseBufferRef.current;

    const gainNode = audioContextRef.current.createGain();
    gainNode.gain.value = 0.3; // Not too loud

    if (withFilter && currentChallenge) {
      // Create and apply EQ filter
      const filter = audioContextRef.current.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = currentChallenge.centerHz;
      filter.Q.value = 1.4; // Moderate Q for musical effect
      filter.gain.value = currentChallenge.changeDb;

      source.connect(filter);
      filter.connect(gainNode);
    } else {
      source.connect(gainNode);
    }

    gainNode.connect(audioContextRef.current.destination);

    source.start(0);
    sourceRef.current = source;

    setCurrentlyPlaying(withFilter ? 'processed' : 'original');

    source.onended = () => {
      setCurrentlyPlaying(null);
    };
  };

  // Start game
  const handleStartGame = () => {
    setGameStarted(true);
    generateChallenge();
  };

  // Submit answer
  const handleSubmit = async () => {
    if (!selectedBand || !currentChallenge) return;

    const isCorrect = selectedBand.id === currentChallenge.correctBand.id;
    setAttempts(attempts + 1);

    // If we have a challenge ID from the API, submit to backend for XP
    if (currentChallenge.id && currentChallenge.frequencyBandId) {
      try {
        const response = await axios.post('/api/v1/eq-challenge/submit/', {
          challenge_id: currentChallenge.id,
          frequency_band_id: currentChallenge.frequencyBandId,
          change_amount: currentChallenge.changeDb
        });

        const { correct, xp_earned, level_up, new_level, unlocked_achievements } = response.data;

        if (correct) {
          setScore(score + 1);
          setFeedback({ correct: true, message: 'Correct! 🎉' });

          // Confetti celebration
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });

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
        } else {
          setFeedback({
            correct: false,
            message: `Incorrect. It was ${response.data.correct_answer.frequency_band}`
          });
        }
      } catch (error) {
        console.error('Error submitting answer:', error);
        // Fallback to client-side feedback
        if (isCorrect) {
          setScore(score + 1);
          setFeedback({ correct: true, message: 'Correct! 🎉' });
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } else {
          setFeedback({
            correct: false,
            message: `Incorrect. It was ${currentChallenge.correctBand.name}`
          });
        }
      }
    } else {
      // Client-side only mode (fallback)
      if (isCorrect) {
        setScore(score + 1);
        setFeedback({ correct: true, message: 'Correct! 🎉' });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setFeedback({
          correct: false,
          message: `Incorrect. It was ${currentChallenge.correctBand.name}`
        });
      }
    }
  };

  // Next challenge
  const handleNext = async () => {
    await generateChallenge();
    setFeedback(null);
    setSelectedBand(null);
  };

  // Handle achievement queue - show one at a time
  useEffect(() => {
    if (achievementQueue.length > 0 && !currentAchievement) {
      setCurrentAchievement(achievementQueue[0]);
      setAchievementQueue(achievementQueue.slice(1));
    }
  }, [achievementQueue, currentAchievement]);

  // Render welcome screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl w-full bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-indigo-100"
        >
          {/* Header with Icon */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="text-6xl mb-4">🎵</div>
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              Frequency Recognition Training
            </h1>
            <p className="text-slate-600 text-lg">
              Train your ears to identify which frequency range was boosted or cut in the audio.
            </p>
          </motion.div>

          {/* Difficulty Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Select Difficulty:</h3>
            <div className="flex gap-4 justify-center flex-wrap">
              {Object.entries(DIFFICULTIES).map(([key, diff], index) => (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDifficulty(key)}
                  className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                    difficulty === key
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/50 scale-105'
                      : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{diff.label}</span>
                    <span className={`text-sm mt-1 ${difficulty === key ? 'opacity-90' : 'opacity-60'}`}>
                      ±{diff.changeDb} dB
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(99, 102, 241, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartGame}
              className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold py-5 px-16 rounded-2xl text-2xl shadow-2xl shadow-indigo-500/50 transition-all duration-300 overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-3">
                Start Training
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.button>
          </motion.div>

          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
        </motion.div>
      </div>
    );
  }

  // Render game
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🎵 Frequency Recognition
          </h1>
          <div className="flex justify-center gap-6 text-lg flex-wrap">
            <div className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-md">
              <span className="font-semibold text-purple-600">Score: </span>
              <span className="font-bold text-slate-800">{score}/{attempts}</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-md">
              <span className="font-semibold text-indigo-600">Difficulty: </span>
              <span className="font-bold text-slate-800">{DIFFICULTIES[difficulty].label}</span>
            </div>
          </div>
        </motion.div>

        {/* Audio Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 mb-6 shadow-xl border border-indigo-100"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center flex items-center justify-center gap-2">
            <span className="text-3xl">🎧</span>
            Listen and Compare
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Original Button */}
            <motion.button
              whileHover={{ scale: currentlyPlaying === null ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => playAudio(false)}
              disabled={currentlyPlaying !== null}
              className={`relative py-10 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden group ${
                currentlyPlaying === 'original'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl shadow-green-500/50 scale-105'
                  : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 shadow-xl'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="relative z-10">
                <div className="text-4xl mb-2">🔊</div>
                <div>Play Original</div>
                {currentlyPlaying === 'original' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm mt-2 font-normal"
                  >
                    <span className="inline-flex gap-1">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse delay-75">●</span>
                      <span className="animate-pulse delay-150">●</span>
                    </span>
                    {' '}Playing...
                  </motion.div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.button>

            {/* Processed Button */}
            <motion.button
              whileHover={{ scale: currentlyPlaying === null ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => playAudio(true)}
              disabled={currentlyPlaying !== null}
              className={`relative py-10 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden group ${
                currentlyPlaying === 'processed'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-2xl shadow-purple-500/50 scale-105'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-xl'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="relative z-10">
                <div className="text-4xl mb-2">🎵</div>
                <div>Play Modified</div>
                {currentlyPlaying === 'processed' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm mt-2 font-normal"
                  >
                    <span className="inline-flex gap-1">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse delay-75">●</span>
                      <span className="animate-pulse delay-150">●</span>
                    </span>
                    {' '}Playing...
                  </motion.div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.button>
          </div>

          <p className="text-center text-slate-600 text-base">
            Compare the two audio samples and identify which frequency was changed
          </p>
        </motion.div>

        {/* Frequency Band Selection */}
        {!feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 mb-6 shadow-xl border border-indigo-100"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center flex items-center justify-center gap-2">
              <span className="text-3xl">🎯</span>
              Which frequency was changed?
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                <p className="text-slate-600 mt-6 text-lg font-medium">Loading challenge...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-8">
                  {FREQUENCY_BANDS.map((band, index) => (
                    <motion.button
                      key={band.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedBand(band)}
                      className={`relative py-8 px-4 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden ${
                        selectedBand?.id === band.id
                          ? `bg-gradient-to-br ${band.color} text-white shadow-2xl shadow-${band.id}-500/50 scale-105 ring-4 ring-white ring-opacity-50`
                          : 'bg-gradient-to-br from-white to-slate-50 text-slate-700 hover:from-slate-50 hover:to-slate-100 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      <div className="relative z-10">
                        <div className="text-4xl mb-3">{band.emoji}</div>
                        <div className="font-extrabold text-xl mb-1">{band.name}</div>
                        <div className={`text-sm ${selectedBand?.id === band.id ? 'opacity-90' : 'opacity-60'} font-semibold`}>
                          {band.centerHz} Hz
                        </div>
                      </div>
                      {selectedBand?.id === band.id && (
                        <motion.div
                          layoutId="selectedRing"
                          className="absolute inset-0 rounded-2xl border-4 border-white/30"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: selectedBand ? 1.02 : 1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!selectedBand}
                  className={`relative w-full py-5 rounded-2xl font-bold text-xl transition-all duration-300 overflow-hidden group ${
                    selectedBand
                      ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white shadow-2xl shadow-green-500/50 hover:shadow-3xl'
                      : 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {selectedBand ? (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Answer
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Select a frequency first
                      </>
                    )}
                  </span>
                  {selectedBand && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 mb-6 text-center shadow-2xl overflow-hidden ${
                feedback.correct
                  ? 'border-4 border-green-400 ring-4 ring-green-200'
                  : 'border-4 border-red-400 ring-4 ring-red-200'
              }`}
            >
              {/* Background glow effect */}
              <div className={`absolute inset-0 ${
                feedback.correct
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50'
                  : 'bg-gradient-to-br from-red-50 to-rose-50'
              } opacity-50`}></div>

              {/* Content */}
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="text-7xl mb-4"
                >
                  {feedback.correct ? '🎉' : '😔'}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`text-4xl font-extrabold mb-6 ${
                    feedback.correct
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {feedback.message}
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold py-4 px-12 rounded-2xl text-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Next Challenge
                    <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold py-4 px-10 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Games
            </span>
          </motion.button>
        </motion.div>

        {/* XP Earned Notification */}
        <AnimatePresence>
          {xpEarned > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-24 right-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-2xl z-40"
            >
              <span className="text-xl font-bold">+{xpEarned} XP</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gamification Modals */}
      <LevelUpModal
        newLevel={newLevel}
        xpEarned={xpEarned}
        onClose={() => {
          setShowLevelUp(false);
          setNewLevel(null);
        }}
      />

      <AchievementUnlockModal
        achievement={currentAchievement}
        onClose={() => setCurrentAchievement(null)}
      />
    </div>
  );
}

export default FrequencyGame;
