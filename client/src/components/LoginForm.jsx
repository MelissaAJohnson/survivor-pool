import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginForm() {
  const { login } = useAuth();
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", inputEmail.trim().toLowerCase());
      formData.append("password", inputPassword);

      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
      } else {
        console.log("Login response:", data);
        login(data.email, data.role);

        // Fetch entries to decide redirect
        const entriesRes = await fetch(`http://localhost:8000/entries?email=${inputEmail.trim().toLowerCase()}`);
        const entriesData = await entriesRes.json();

        setTimeout(() => {
          const hasEntries = Array.isArray(entriesData) && entriesData.length > 0;
          navigate(hasEntries ? "/pick" : "/entry");
        }, 100);
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
      <label htmlFor="email">Email:</label>
      <input
        id="email"
        type="email"
        value={inputEmail}
        onChange={(e) => setInputEmail(e.target.value)}
        required
        disabled={loading}
        style={{ display: "block", margin: "0.5rem 0" }}
      />

      <label htmlFor="password">Password:</label>
      <input
        id="password"
        type="password"
        value={inputPassword}
        onChange={(e) => setInputPassword(e.target.value)}
        required
        disabled={loading}
        style={{ display: "block", margin: "0.5rem 0" }}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Log In"}
      </button>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </form>
  );
}