// src/components/GameDetail.jsx - Game component with 3-attempts functionality
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../axiosConfig';
import LevelUpModal from './LevelUpModal';
import AchievementUnlockModal from './AchievementUnlockModal';

function GameDetail() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [game, setGame] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [audioFile, setAudioFile] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState(''); // 'success', 'error', or ''
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);

  // Gamification state
  const [xpEarned, setXpEarned] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(null);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [achievementQueue, setAchievementQueue] = useState([]);

  // Ref for the audio element
  const audioRef = useRef(null);

  // Fetch game details
  useEffect(() => {
    axios.get(`/api/v1/games/${gameId}/`)
      .then(response => {
        setGame(response.data);
      })
      .catch(error => {
        console.error("Error fetching game details:", error);
      });
  }, [gameId]);

  // Fetch a random challenge
  const fetchRandomChallenge = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/challenges/random/?game_id=${gameId}`);
      setChallenge(response.data);
      const newAudio = response.data.correct_answer.toLowerCase() + "3.wav";
      setAudioFile(newAudio);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      setLoading(false);
    }
  };

  // Start a new game session
  const startNewSession = async () => {
    try {
      const response = await axios.post('/api/v1/game-sessions/create/', {
        game_id: gameId
      });
      setSessionId(response.data.id);
      setScore(0);
      setAttemptsLeft(3);
      setGameOver(false);
      setFeedback('');
      setFeedbackType('');
      await fetchRandomChallenge();
    } catch (error) {
      console.error("Error starting new session:", error);
    }
  };

  // Initialize game on component mount
  useEffect(() => {
    startNewSession();
  }, [gameId]);

  // Play audio when a new challenge is loaded
  useEffect(() => {
    if (audioRef.current && !loading && challenge) {
      audioRef.current.play();
    }
  }, [challenge, loading]);

  // Handle answer submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!answer.trim()) {
      setFeedback("Please enter an answer");
      setFeedbackType("error");
      return;
    }

    try {
      const response = await axios.post('/api/v1/submit-answer/', {
        challenge_id: challenge.id,
        answer: answer.trim(),
        session_id: sessionId
      });

      const { result, xp_earned, level_up, new_level, unlocked_achievements } = response.data;

      // If the answer is correct
      if (result === "Correct!") {
        setScore(score + 1);
        setFeedback("Correct! Good job!");
        setFeedbackType("success");
        setAnswer('');

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

        // Fetch a new challenge
        await fetchRandomChallenge();
      }
      // If the answer is incorrect
      else {
        const newAttemptsLeft = attemptsLeft - 1;
        setAttemptsLeft(newAttemptsLeft);

        // If no attempts left, end the game
        if (newAttemptsLeft <= 0) {
          setGameOver(true);
          setFeedback(`Game over! Your final score: ${score}`);
          setFeedbackType("error");
        } else {
          setFeedback(`Incorrect. You have ${newAttemptsLeft} ${newAttemptsLeft === 1 ? 'attempt' : 'attempts'} left.`);
          setFeedbackType("error");
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setFeedback("Error submitting your answer. Please try again.");
      setFeedbackType("error");
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

  // Handle playing the audio again
  const playAudioAgain = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  if (loading && !challenge) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen"
    >
      <div className="text-xl text-indigo-600">Loading challenge...</div>
    </motion.div>
  );

  const progressPercentage = (attemptsLeft / 3) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="game-detail-container min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 px-4 py-8"
    >
      {game && (
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        >
          {game.name}
        </motion.h1>
      )}

      <AnimatePresence mode="wait">
        {gameOver ? (
          <motion.div
            key="game-over"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="game-over max-w-md mx-auto bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center border border-slate-200"
          >
            <h2 className="text-3xl font-bold mb-4 text-slate-800">Game Over</h2>
            <p className="text-xl mb-6 text-slate-700">Your final score: <span className="font-bold text-indigo-600">{score}</span></p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startNewSession}
              className="play-again-btn w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg mb-3 shadow-md hover:shadow-lg transition-shadow"
            >
              Play Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="back-btn w-full bg-gradient-to-r from-slate-500 to-slate-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              Back to Games
            </motion.button>
          </motion.div>
        ) : (
          challenge && (
            <motion.div
              key="challenge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="challenge-container max-w-2xl mx-auto bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-slate-200"
            >
              <div className="score-section flex justify-between items-center mb-6">
                <motion.div
                  key={score}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="score text-2xl font-bold text-indigo-600"
                >
                  Score: {score}
                </motion.div>
                <div className="attempts-container">
                  <div className="text-sm text-slate-600 mb-1">
                    Attempts left: {attemptsLeft}
                  </div>
                  <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${attemptsLeft === 3 ? 'bg-green-500' : attemptsLeft === 2 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      initial={{ width: '100%' }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              <div className="challenge-prompt mb-6">
                <h2 className="text-2xl font-bold mb-2 text-slate-800">{challenge.prompt}</h2>
                <p className="text-slate-600 mb-2">Listen to the note and type your answer.</p>
                <p className="note-hint text-sm text-slate-500 italic">
                  For sharps, use format: "asharp" (e.g., A#), and for naturals: "a" (e.g., A)
                </p>
              </div>

              <div className="audio-section mb-6">
                {audioFile && (
                  <>
                    <audio ref={audioRef} key={audioFile}>
                      <source src={`/static/audio/notes/${audioFile}`} type="audio/wav" />
                      Your browser does not support the audio element.
                    </audio>
                    <div className="audio-controls flex justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={playAudioAgain}
                        className="play-btn bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                      >
                        Play Note
                      </motion.button>
                    </div>
                  </>
                )}
              </div>

              <form onSubmit={handleSubmit} className="answer-form space-y-4">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer (e.g., c, csharp)"
                  className="answer-input w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors text-lg"
                  autoFocus
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="submit-btn w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  Submit Answer
                </motion.button>
              </form>

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`feedback mt-4 p-4 rounded-lg text-center font-semibold ${
                      feedbackType === 'success'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}
                  >
                    {feedback}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
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
    </motion.div>
  );
}

export default GameDetail;
