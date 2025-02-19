// src/components/GameDetail.jsx
import React, { useEffect, useState } from 'react';
import axios from '../axiosConfig';
 
import { useParams } from 'react-router-dom';

function GameDetail() {
  const { gameId } = useParams(); // Extract the gameId from the URL.
  const [challenge, setChallenge] = useState(null); // State to store the challenge data.
  const [audioFile, setAudioFile] = useState(''); // State to store the computed audio file name.
  const [answer, setAnswer] = useState(''); // State for the user's answer input.
  const [feedback, setFeedback] = useState(''); // State to store feedback from the backend.
  const [loading, setLoading] = useState(true); // Loading state to indicate data is being fetched.

  // useEffect hook to fetch challenge data when the component mounts or when gameId changes.
  useEffect(() => {
    axios.get(`http://localhost:8000/api/v1/challenges/random/?game_id=${gameId}`)
      .then(response => {
        setChallenge(response.data); // Save the fetched challenge.
        // Compute the audio file name:
        // Assuming the canonical correct_answer is in lowercase (e.g., "c" or "asharp"),
        // we append "3.wav" to get the file name (e.g., "c3.wav").
        setAudioFile(response.data.correct_answer.toLowerCase() + "3.wav");
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching challenge:", error);
        setLoading(false);
      });
  }, [gameId]); // Dependency array ensures this effect runs whenever gameId changes.

  // Handle the answer submission.
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the form from reloading the page.
    axios.post(`http://localhost:8000/game/${gameId}/`, { answer })
      .then(response => {
        // Set feedback from the response, or default to a generic message.
        setFeedback(response.data.result || "No feedback provided");
        setAnswer('');  // Clear the input box after submission.
        // Optionally, refresh the challenge or update the score here.
      })
      .catch(error => {
        console.error("Error submitting answer:", error);
      });
  };

  // If the challenge data is still loading, display a loading message.
  if (loading) return <div>Loading challenge...</div>;

  return (
    <div>
      {challenge ? (
        <>
          {/* Display the challenge prompt */}
          <h2>{challenge.prompt}</h2>
          {/* If the challenge is a note and an audio file is computed, display an audio player */}
          {challenge.challenge_type === "note" && audioFile && (
            <audio controls>
              <source src={`http://localhost:8000/static/audio/notes/${audioFile}`} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          )}
          {/* Form for submitting the answer */}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer"
            />
            <button type="submit">Submit Answer</button>
          </form>
          {/* Display feedback from the backend */}
          {feedback && <p>{feedback}</p>}
        </>
      ) : (
        <p>No challenge available.</p>
      )}
    </div>
  );
}

export default GameDetail;
