// src/components/Login.jsx
/**
 * Login.jsx
 * ---------
 * A simple login form that sends a POST request to the token endpoint.
 * On success, it stores the JWT in localStorage and navigates to the home page.
 */

import React, { useState } from 'react';
import axios from '../axiosConfig';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');    // Stores the username entered by the user.
  const [password, setPassword] = useState('');    // Stores the password.
  const [error, setError] = useState('');          // Stores any error messages.
  const navigate = useNavigate();                  // Hook to navigate to a different route on success.

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the form from reloading the page.
    
    try {
      // Send a POST request to the token endpoint with the username and password.
      const response = await axios.post('http://localhost:8000/api/token/', {
        username: username,
        password: password,
      });
      
      // On success, store the tokens in localStorage.
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Optionally, set axios default header to include the access token for future requests.
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      
      // Navigate to the home page (or another protected page).
      navigate('/');
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid username or password.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Log In</button>
      </form>
    </div>
  );
}

export default Login;
