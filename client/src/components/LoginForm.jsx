import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append("email", email);

    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const text = await res.text();
      if (!res.ok) {
        setMessage(`❌ ${text}`);
        return;
      }

      const data = JSON.parse(text);
      localStorage.setItem("userEmail", email);
      if (onLogin) onLogin(email);
      setMessage(`✅ ${data.message}`);

      // Fetch user entry info
      const adminRes = await fetch("http://localhost:8000/admin");
      const users = await adminRes.json();
      const currentUser = users.find(u => u.email === email);

      if (currentUser?.entries?.length > 0) {
        navigate("/pick"); // has entries
      } else {
        navigate("/entry"); // no entries yet
      }

    } catch (err) {
      console.error("Login failed:", err);
      setMessage("❌ Could not connect to server.");
    }
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        /><br /><br />
        <button type="submit">Log In</button>
      </form>
      {message && <p style={{ fontWeight: "bold" }}>{message}</p>}
    </div>
  );
}