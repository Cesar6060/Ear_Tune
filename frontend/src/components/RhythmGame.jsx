import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import axios from '../axiosConfig';
import LevelUpModal from './LevelUpModal';
import AchievementUnlockModal from './AchievementUnlockModal';

function RhythmGame() {
  const navigate = useNavigate();

  // State
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tappedBeats, setTappedBeats] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [metronomePulse, setMetronomePulse] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Gamification state
  const [xpEarned, setXpEarned] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(null);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [achievementQueue, setAchievementQueue] = useState([]);

  // Audio refs
  const audioRef = useRef(null);
  const startTimeRef = useRef(null);
  const metronomeIntervalRef = useRef(null);

  // Load new challenge on mount
  useEffect(() => {
    loadNewChallenge();

    // Cleanup on unmount
    return () => {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
      }
    };
  }, []);

  // Keyboard event listener for spacebar
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && isRecording && !hasSubmitted) {
        e.preventDefault();
        handleTap();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRecording, hasSubmitted]);

  const loadNewChallenge = async () => {
    setLoading(true);
    setTappedBeats([]);
    setIsRecording(false);
    setHasSubmitted(false);
    setAccuracy(null);
    setIsPlaying(false);

    try {
      const response = await axios.get('/api/v1/rhythm-challenge/random/');
      setChallenge(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading challenge:', error);
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current && challenge) {
      // Reset if already playing
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setIsRecording(false);
        if (metronomeIntervalRef.current) {
          clearInterval(metronomeIntervalRef.current);
        }
        return;
      }

      setIsPlaying(true);
      setTappedBeats([]);
      audioRef.current.play();

      // Start visual metronome
      const bpm = challenge.tempo || 120;
      const intervalMs = (60 / bpm) * 1000;

      metronomeIntervalRef.current = setInterval(() => {
        setMetronomePulse(true);
        setTimeout(() => setMetronomePulse(false), 100);
      }, intervalMs);
    }
  };

  const startRecording = () => {
    if (!isPlaying) {
      alert('Please play the audio first!');
      return;
    }

    setIsRecording(true);
    setTappedBeats([]);
    startTimeRef.current = Date.now();
  };

  const handleTap = () => {
    if (!isRecording || hasSubmitted) return;

    const currentTime = Date.now();
    const elapsedTime = currentTime - startTimeRef.current; // Keep in milliseconds

    setTappedBeats(prev => [...prev, elapsedTime]);
  };

  const submitAnswer = async () => {
    if (tappedBeats.length === 0) {
      alert('Please tap some beats first!');
      return;
    }

    setHasSubmitted(true);

    try {
      const response = await axios.post('/api/v1/rhythm-challenge/submit/', {
        challenge_id: challenge.id,
        user_taps: tappedBeats
      });

      const { accuracy: scoreAccuracy, correct, xp_earned, level_up, new_level, unlocked_achievements } = response.data;
      setAccuracy(scoreAccuracy);
      setAttempts(attempts + 1);

      if (correct || scoreAccuracy >= 95) {
        setScore(score + 1);
        // Trigger confetti celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#667eea', '#764ba2', '#84fab0', '#8fd3f4']
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

        // Auto-load next challenge after celebration
        setTimeout(() => {
          loadNewChallenge();
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Error submitting your answer. Please try again.');
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

  const resetRecording = () => {
    setTappedBeats([]);
    setIsRecording(false);
    setHasSubmitted(false);
    setAccuracy(null);
    startTimeRef.current = null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Rhythm Training Game
          </h1>
          <div className="flex justify-center gap-8 text-lg">
            <span className="text-purple-300">Score: {score}/{attempts}</span>
            <span className="text-blue-300">
              Difficulty: {challenge?.difficulty || 'beginner'}
            </span>
          </div>
        </motion.div>

        {/* Main Game Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-2xl p-8 mb-6"
        >
          {/* Visual Metronome */}
          <div className="flex justify-center mb-8">
            <motion.div
              animate={{
                scale: metronomePulse ? 1.3 : 1,
                opacity: metronomePulse ? 1 : 0.5
              }}
              transition={{ duration: 0.1 }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl flex items-center justify-center"
            >
              <span className="text-white text-2xl font-bold">
                {challenge?.tempo || 120} BPM
              </span>
            </motion.div>
          </div>

          {/* Audio Controls */}
          <div className="flex justify-center gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={playAudio}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                isPlaying
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gradient-primary text-white'
              }`}
            >
              {isPlaying ? 'Stop Audio' : 'Play Audio'}
            </motion.button>

            {isPlaying && !isRecording && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="px-8 py-4 rounded-xl font-semibold text-lg bg-green-500 hover:bg-green-600 text-white transition-all"
              >
                Start Recording
              </motion.button>
            )}
          </div>

          {/* Instructions */}
          <AnimatePresence mode="wait">
            {!isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-gray-300 mb-6"
              >
                <p className="text-lg">Click "Play Audio" to hear the rhythm</p>
              </motion.div>
            )}

            {isPlaying && !isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-gray-300 mb-6"
              >
                <p className="text-lg">
                  Listen carefully, then click "Start Recording" to begin
                </p>
              </motion.div>
            )}

            {isRecording && !hasSubmitted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-yellow-300 mb-6"
              >
                <p className="text-lg font-semibold">
                  Tap the button below or press SPACEBAR to match the rhythm!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap Button */}
          {isRecording && !hasSubmitted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center mb-8"
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleTap}
                className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-2xl shadow-2xl hover:shadow-yellow-500/50 transition-shadow"
              >
                TAP
                <div className="text-sm mt-2">(or Spacebar)</div>
              </motion.button>
            </motion.div>
          )}

          {/* Tapped Beats Visualization */}
          {tappedBeats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-white text-xl font-semibold mb-3 text-center">
                Your Taps ({tappedBeats.length})
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {tappedBeats.map((beat, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-lg"
                  >
                    {index + 1}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          {isRecording && !hasSubmitted && tappedBeats.length > 0 && (
            <div className="flex justify-center gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetRecording}
                className="px-6 py-3 rounded-xl font-semibold bg-gray-600 hover:bg-gray-700 text-white transition-all"
              >
                Reset
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={submitAnswer}
                className="px-8 py-3 rounded-xl font-semibold bg-gradient-success text-gray-900 transition-all"
              >
                Submit Answer
              </motion.button>
            </div>
          )}

          {/* Accuracy Results */}
          <AnimatePresence>
            {hasSubmitted && accuracy !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`mt-8 p-6 rounded-xl text-center ${
                  accuracy >= 95
                    ? 'bg-gradient-success'
                    : accuracy >= 70
                    ? 'bg-gradient-warm'
                    : 'bg-gradient-error'
                }`}
              >
                <motion.h2
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className="text-3xl font-bold text-gray-900 mb-2"
                >
                  {accuracy >= 95 ? 'Excellent!' : accuracy >= 70 ? 'Good Try!' : 'Keep Practicing!'}
                </motion.h2>
                <motion.p
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="text-5xl font-bold text-gray-900"
                >
                  {accuracy.toFixed(1)}% Accurate
                </motion.p>
                {accuracy >= 95 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-gray-800 mt-2"
                  >
                    Loading next challenge...
                  </motion.p>
                )}
                {accuracy < 95 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadNewChallenge}
                    className="mt-4 px-6 py-3 rounded-xl font-semibold bg-gray-900 text-white transition-all"
                  >
                    Try Another
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden Audio Element */}
          {challenge && (
            <audio
              ref={audioRef}
              src={`/${challenge.audio_file}`}
              onEnded={() => {
                setIsPlaying(false);
                if (metronomeIntervalRef.current) {
                  clearInterval(metronomeIntervalRef.current);
                }
              }}
            />
          )}
        </motion.div>

        {/* Back Button */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl font-semibold glass text-white transition-all"
          >
            Back to Games
          </motion.button>
        </div>
      </div>

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
    </div>
  );
}

export default RhythmGame;
