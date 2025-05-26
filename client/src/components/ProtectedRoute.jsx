import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
    const email = localStorage.getItem("userEmail");
    return email ? children : <Navigate to="/" replace />;
}