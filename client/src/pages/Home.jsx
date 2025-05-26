import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';

export default function Home() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem("userEmail");
    if (stored) {
      setEmail(stored);
    }
  }, []);

  return (
    <div>
      <h1>Welcome to the Office Survivor Pool!</h1>
      {email ? (
        <p>✅ Logged in as <strong>{email}</strong></p>
      ) : (
        <>
          <p>Please log in to continue:</p>
          <LoginForm onLogin={(email) => setEmail(email)} />
        </>
      )}
    </div>
  );
}