// src/components/NavBar.jsx - Navigation bar component
import React from 'react';
import { Link } from 'react-router-dom';


function NavBar({ isAuthenticated, onLogout }) {
  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">EarTune</Link>
      </div>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/">Games</Link>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;