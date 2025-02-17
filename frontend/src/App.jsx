import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import GameDetail from './components/GameDetail';

function App() {
  return (
    <Router>
      <div className="App">
        <header>
          <h1>EarTune</h1>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:gameId" element={<GameDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
