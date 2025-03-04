// src/components/GameHistory.jsx
import React, { useEffect, useState } from 'react';
import axios from '../axiosConfig';

function GameHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch user's game session history
    axios.get('/api/v1/game-sessions/')
      .then(response => {
        setSessions(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching game history:', error);
        setError('Failed to load game history. Please try again later.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading game history...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="game-history-container">
      <h1>Your Game History</h1>
      
      {sessions.length > 0 ? (
        <div className="sessions-list">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Game</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => (
                <tr key={session.id}>
                  <td>{new Date(session.date_played).toLocaleString()}</td>
                  <td>{session.challenge?.game?.name || 'Unknown Game'}</td>
                  <td>{session.score}</td>
                  <td>{session.active ? 'In Progress' : 'Completed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-history">
          <p>You haven't played any games yet.</p>
          <p>Start a game to begin tracking your progress!</p>
        </div>
      )}
    </div>
  );
}

export default GameHistory;