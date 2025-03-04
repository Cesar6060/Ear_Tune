// src/components/GameDetail.jsx - Game component with 3-attempts functionality
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';

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
      
      // If the answer is correct
      if (response.data.result === "Correct!") {
        setScore(score + 1);
        setFeedback("Correct! Good job!");
        setFeedbackType("success");
        setAnswer('');
        
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

  // Handle playing the audio again
  const playAudioAgain = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  if (loading && !challenge) return <div className="loading">Loading challenge...</div>;

  return (
    <div className="game-detail-container">
      {game && <h1>{game.name}</h1>}
      
      {gameOver ? (
        <div className="game-over">
          <h2>Game Over</h2>
          <p>Your final score: {score}</p>
          <button onClick={startNewSession} className="play-again-btn">
            Play Again
          </button>
          <button onClick={() => navigate('/')} className="back-btn">
            Back to Games
          </button>
        </div>
      ) : (
        challenge && (
          <div className="challenge-container">
            <div className="score-section">
              <div className="score">Score: {score}</div>
              <div className="attempts">
                Attempts left: {attemptsLeft}
              </div>
            </div>
            
            <div className="challenge-prompt">
              <h2>{challenge.prompt}</h2>
              <p>Listen to the note and type your answer.</p>
              <p className="note-hint">
                <em>For sharps, use format: "asharp" (e.g., A#), and for naturals: "a" (e.g., A)</em>
              </p>
            </div>
            
            <div className="audio-section">
              {audioFile && (
                <>
                  <audio ref={audioRef} key={audioFile}>
                    <source src={`/static/audio/notes/${audioFile}`} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                  <div className="audio-controls">
                    <button onClick={playAudioAgain} className="play-btn">
                      Play Note
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="answer-form">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter your answer (e.g., c, csharp)"
                className="answer-input"
                autoFocus
              />
              <button type="submit" className="submit-btn">
                Submit Answer
              </button>
            </form>
            
            {feedback && (
              <div className={`feedback ${feedbackType}`}>
                {feedback}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

export default GameDetail;
