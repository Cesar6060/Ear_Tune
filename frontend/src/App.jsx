// src/App.jsx - Main application component with routing
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import GameDetail from './components/GameDetail';
import Login from './components/Login';
import Register from './components/Register';
import GameHistory from './components/GameHistory';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  // Function to handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <div className="app-container">
        <NavBar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <main className="content">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/game/:gameId" element={
              <ProtectedRoute>
                <GameDetail />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <GameHistory />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>EarTune - Train Your Musical Ear</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;