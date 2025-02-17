// src/components/Home.jsx
/**
 * Home.jsx
 * --------
 * This component fetches a list of games from the backend API
 * and displays them as links. When a user clicks a link, they navigate to the game detail page.
 */

import React, { useEffect, useState } from 'react';
// React is imported for JSX, and useEffect and useState are React hooks for managing side effects and component state.
import axios from 'axios';
// Axios is a promise-based HTTP client for making API requests.
import { Link } from 'react-router-dom';
// Link is a component from React Router that enables navigation without reloading the page.

function Home() {
  const [games, setGames] = useState([]);  // State to store the list of games.
  const [loading, setLoading] = useState(true);  // State to indicate if data is being loaded.

  // useEffect hook runs after the component is rendered.
  // Here we use it to fetch data from the backend API.
  useEffect(() => {
    axios.get('http://localhost:8000/api/v1/games/')
      .then(response => {
        setGames(response.data);  // Set the games state with the data from the API.
        setLoading(false);  // Data is loaded, so turn off the loading indicator.
      })
      .catch(error => {
        console.error("Error fetching games:", error);
        setLoading(false);  // Even on error, stop the loading indicator.
      });
  }, []);  // Empty dependency array means this runs only once when the component mounts.

  // If loading is true, display a loading message.
  if (loading) return <div>Loading games...</div>;

  return (
    <div>
      <h2>Welcome to EarTune!</h2>
      <p>Please select a game to begin:</p>
      {games.length > 0 ? (
        // Map over the games array and create a list item for each game.
        <ul>
          {games.map(game => (
            <li key={game.id}>
              {/* Link to the Game Detail page. When clicked, navigates to /game/{game.id} */}
              <Link to={`/game/${game.id}`}>{game.name}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No games available.</p>
      )}
    </div>
  );
}

export default Home;
// Exports the Home component so it can be used in App.jsx.
