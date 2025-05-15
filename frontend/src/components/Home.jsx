// src/components/Home.jsx - Home page displaying available games
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  if (loading) return <div className="loading">Loading games...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="home-container">
      <h1>Welcome to EarTune!</h1>
      <p className="home-description">
        Improve your ear for music with interactive training games.
        Select a game below to begin your practice.
      </p>
      {games.length > 0 ? (
        <div className="games-list">
          {games.map(game => (
            <div key={game.id} className="game-card">
              <h2>{game.name}</h2>
              <p>{game.description}</p>
              <Link to={`/game/${game.id}`} className="start-button">
                Start Game
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-games">No games available at the moment.</p>
      )}
    </div>
  );
}

export default Home;