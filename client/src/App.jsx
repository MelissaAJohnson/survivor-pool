import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Home from './pages/Home';
import Register from './pages/Register';
import EntryForm from './pages/EntryForm';
import Pick from './pages/Pick';
import Admin from './pages/Admin';
import GameAdmin from './pages/GameAdmin';
import TeamAdmin from './pages/TeamAdmin';
import TeamResultsAdmin from './pages/TeamResultsAdmin';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  // const [loggedInEmail, setLoggedInEmail] = useState(null);
  const { email } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (email) {
      // Only navigate after login if needed
    }
  }, [email]);
  
  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    setLoggedInEmail(null);
    navigate('/');
  };
}

export default function App() {
  return (
    <div>
      <Navbar />
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
          path="/admin/game" element={
            <ProtectedRoute><GameAdmin /></ProtectedRoute>
          } />
        <Route 
          path="/teams" 
          element={<ProtectedRoute><TeamAdmin /></ProtectedRoute>} 
        />
        <Route
          path="team-results" element={
            <ProtectedRoute>
              <TeamResultsAdmin />
            </ProtectedRoute>
          } />
      </Routes>
    </div>
  );
}