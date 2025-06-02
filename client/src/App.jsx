import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import EntryForm from './pages/EntryForm';
import Pick from './pages/Pick';
import Admin from './pages/Admin';
import TeamAdmin from './pages/TeamAdmin';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const [loggedInEmail, setLoggedInEmail] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) setLoggedInEmail(email);
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    setLoggedInEmail(null);
    navigate('/');
  };
  
  return (
    <>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
  
        {loggedInEmail ? (
          <>
            <Link to="/entry" style={{ marginRight: '15px' }}>New Entry</Link>
            <Link to="/pick" style={{ marginRight: '15px' }}>My Picks</Link>
            <Link to="/admin" style={{ marginRight: '15px' }}>Admin</Link>
            <Link to="/teams" style={{ marginRight: '15px' }}>Teams</Link>
            <button onClick={handleLogout}>Log Out</button>
          </>
        ) : (
          <Link to="/register" style={{ marginRight: '15px' }}>Register</Link>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/entry"
          element={<ProtectedRoute><EntryForm /></ProtectedRoute>}
        />
        <Route
          path="/pick"
          element={<ProtectedRoute><Pick /></ProtectedRoute>}
        />
        <Route 
          path="/admin" 
          element={<ProtectedRoute><Admin /></ProtectedRoute>} 
        />
        <Route 
          path="/teams" 
          element={<ProtectedRoute><TeamAdmin /></ProtectedRoute>} 
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}