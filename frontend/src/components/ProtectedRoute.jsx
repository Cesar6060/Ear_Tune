// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

// A wrapper component for routes that require authentication
function ProtectedRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem('access_token');
  
  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render the children (the protected component)
  return children;
}

export default ProtectedRoute;