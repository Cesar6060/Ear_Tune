// src/components/GameDetail.jsx
import React, { useEffect, useState } from 'react';
import axios from '../axiosConfig';
import { useParams } from 'react-router-dom';

function GameDetail() {
  const { gameId } = useParams(); 
  const [challenge, setChallenge] = useState(null); 
  const [audioFile, setAudioFile] = useState(''); 
  const [answer, setAnswer] = useState(''); 
  const [feedback, setFeedback] = useState(''); 
  const [loading, setLoading] = useState(true); 

  // useEffect hook to fetch challenge data when the component mounts or when gameId changes.
  useEffect(() => {
    axios.get(`http://localhost:8000/api/v1/challenges/random/?game_id=${gameId}`)
      .then(response => {
        setChallenge(response.data); 
        setAudioFile(response.data.correct_answer.toLowerCase() + "3.wav");
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching challenge:", error);
        setLoading(false);
      });
  }, [gameId]); 

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    try {
      // Send the answer to the backend
      const postResponse = await axios.post(`http://localhost:8000/game/${gameId}/`, { answer });
      console.log("POST response:", postResponse.data);  // Log the backend feedback
      setFeedback(postResponse.data.result || "No feedback provided");
      setAnswer(''); // Clear the input box
      
      // Re-fetch a new challenge to update the note
      const getResponse = await axios.get(`http://localhost:8000/api/v1/challenges/random/?game_id=${gameId}`);
      console.log("Fetched new challenge:", getResponse.data);  // Log the new challenge
      setChallenge(getResponse.data);
      setAudioFile(getResponse.data.correct_answer.toLowerCase() + "3.wav");
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
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
