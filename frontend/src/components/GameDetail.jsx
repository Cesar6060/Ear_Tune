import React, { useEffect, useState } from 'react';
import axios from '../axiosConfig';
import { useParams } from 'react-router-dom';

function GameDetail() {
  const { gameId } = useParams(); // Extracts the gameId from the URL.
  const [challenge, setChallenge] = useState(null); // Holds the current challenge data.
  const [audioFile, setAudioFile] = useState(''); // Computed audio file name.
  const [answer, setAnswer] = useState(''); // User's answer input.
  const [feedback, setFeedback] = useState(''); // Feedback message from the backend.
  const [loading, setLoading] = useState(true); // Loading state.

  // Fetch a random challenge for the game when the component mounts or gameId changes.
  useEffect(() => {
    axios.get(`http://localhost:8000/api/v1/challenges/random/?game_id=${gameId}`)
      .then(response => {
        setChallenge(response.data);
        // Compute the audio file name from the canonical answer.
        setAudioFile(response.data.correct_answer.toLowerCase() + "3.wav");
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching challenge:", error);
        setLoading(false);
      });
  }, [gameId]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload on form submission.
    try {
      // Send the answer to the backend.
      const postResponse = await axios.post(`http://localhost:8000/api/v1/submit-answer/`, {
        challenge_id: challenge.id,
        answer: answer
      });
      console.log("POST response:", postResponse.data);
      setFeedback(postResponse.data.result || "No feedback provided");
      setAnswer(''); // Clear the input box.
      
      // Re-fetch a new random challenge.
      const getResponse = await axios.get(`http://localhost:8000/api/v1/challenges/random/?game_id=${gameId}`);
      console.log("New challenge fetched:", getResponse.data);
      setChallenge(getResponse.data);
      const newAudio = getResponse.data.correct_answer.toLowerCase() + "3.wav";
      console.log("Computed audio file:", newAudio);
      setAudioFile(newAudio);
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };
  

  if (loading) return <div>Loading challenge...</div>;

  return (
    <div>
      {challenge ? (
        <>
          <h2>{challenge.prompt}</h2>
          {challenge.challenge_type === "note" && audioFile && (
            // Updated: Added key attribute to force re-render of the audio element.
            <audio key={audioFile} controls>
              <source src={`http://localhost:8000/static/audio/notes/${audioFile}`} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          )}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer"
            />
            <button type="submit">Submit Answer</button>
          </form>
          {feedback && <p>{feedback}</p>}
        </>
      ) : (
        <p>No challenge available.</p>
      )}
    </div>
  );
}


export default GameDetail;
