import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext"

export default function LoginForm() {
  const { login } = useAuth();
  const [inputEmail, setInputEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/entries?email=${inputEmail.trim().toLowerCase()}`);
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        login(inputEmail.trim().toLowerCase());

        //Delay just enough to let context propogate
        setTimeout(() => {
          const hasEntries = data.length > 0;
          navigate(hasEntries ? "/pick" : "/entry");
        }, 100);
      } else {
        setError("Login failed: email not found.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");      
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <label htmlFor="email">Enter your email to log in:</label>
      <input
        id="email"
        type="email"
        required
        value={inputEmail}
        onChange={(e) => setInputEmail(e.target.value)}
        placeholder="Enter your email"
        style={{ display: "block", width: "75%", margin: "1rem 0", padding: "0.5rem" }}
        disabled={loading}
      />
      <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem" }}>
        {loading ? "Logging in ..." : "Log In"}
      </button>
      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </form>
  );
}