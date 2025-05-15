import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';

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
      
      const { correct, correct_answer } = response.data;
      
      setFeedback({
        correct,
        correctAnswer: correct_answer,
        message: correct ? 'Correct! Well done!' : 'Incorrect. Try again!'
      });
      
      setAttempts(attempts + 1);
      if (correct) {
        setScore(score + 1);
        setTimeout(loadNewChallenge, 2000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading challenge...</div>;
  }
  
  return (
    <div className="frequency-game-container">
      <h1>Frequency Recognition Training</h1>
      
      <div className="game-stats">
        <span>Score: {score}/{attempts}</span>
        <span>Difficulty: {difficulty}</span>
      </div>
      
      <div className="difficulty-selector">
        <button 
          className={difficulty === 'beginner' ? 'active' : ''}
          onClick={() => setDifficulty('beginner')}
        >
          Beginner
        </button>
        <button 
          className={difficulty === 'intermediate' ? 'active' : ''}
          onClick={() => setDifficulty('intermediate')}
        >
          Intermediate
        </button>
        <button 
          className={difficulty === 'advanced' ? 'active' : ''}
          onClick={() => setDifficulty('advanced')}
        >
          Advanced
        </button>
      </div>
      
      <div className="audio-controls">
        <h2>Listen and Compare</h2>
        <div className="audio-buttons">
          <button 
            onClick={playOriginal}
            className={currentlyPlaying === 'original' ? 'playing' : ''}
          >
            Play Original
          </button>
          <button 
            onClick={playProcessed}
            className={currentlyPlaying === 'processed' ? 'playing' : ''}
          >
            Play Modified
          </button>
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
              src={`/static/audio/eq_samples/${challenge.source_audio}_${challenge.frequency_band.name.toLowerCase()}_${challenge.change_amount}db.wav`}
              onEnded={() => setCurrentlyPlaying(null)}
            />
          </>
        )}
      </div>
      
      <div className="answer-section">
        <h3>Which frequency was changed?</h3>
        <div className="frequency-band-grid">
          {frequencyBands.map(band => (
            <button
              key={band.id}
              className={`freq-band-btn ${selectedBand === band.id ? 'selected' : ''}`}
              onClick={() => setSelectedBand(band.id)}
            >
              <span className="band-name">{band.name}</span>
              <span className="band-range">{band.min_frequency}-{band.max_frequency} Hz</span>
            </button>
          ))}
        </div>
        
        <h3>By how much?</h3>
        <div className="change-amount-grid">
          {[-12, -9, -6, -3, 0, 3, 6, 9, 12].map(amount => (
            <button
              key={amount}
              className={`change-btn ${selectedChange === amount ? 'selected' : ''}`}
              onClick={() => setSelectedChange(amount)}
            >
              {amount > 0 ? '+' : ''}{amount} dB
            </button>
          ))}
        </div>
        
        <button 
          className="submit-answer-btn"
          onClick={submitAnswer}
          disabled={!selectedBand || selectedChange === null}
        >
          Submit Answer
        </button>
      </div>
      
      {feedback && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'incorrect'}`}>
          <p>{feedback.message}</p>
          {!feedback.correct && (
            <p>
              Correct answer: {feedback.correctAnswer.frequency_band} 
              ({feedback.correctAnswer.change_amount > 0 ? '+' : ''}
              {feedback.correctAnswer.change_amount} dB)
            </p>
          )}
        </div>
      )}
      
      <button onClick={() => navigate('/')} className="back-btn">
        Back to Games
      </button>
    </div>
  );
}

export default FrequencyGame;