import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState("");
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("userEmail", email);
        navigate("/entry");
      } else {
        setError(data.detail || "Registration failed.");
      }
    } catch (err) {
      console.error("Register failed:", err);
      setError("❌ Could not connect to backend.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Register</h2>
      {error && <p style={{ color:"red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          style={{ width: "100%", marginBottom: "1rem"}}
          required
        /><br /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: "1rem"}}
          required
        /><br /><br />
        <button type="submit">Register</button>
      </form>

      {message && (
        <p style={{ marginTop: "15px", fontWeight: "bold" }}>{message}</p>
      )}
    </div>
  );
}