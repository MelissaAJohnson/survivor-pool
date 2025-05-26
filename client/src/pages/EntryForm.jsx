import React, { useState, useEffect } from 'react';

export default function EntryForm() {
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [entries, setEntries] = useState([]);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      setMessage("You must be logged in to view your entries.");
      return;
    }

    setEmail(userEmail);
    fetchEntries(userEmail);
  }, []);

  const fetchEntries = async (userEmail) => {
    try {
      const res = await fetch("http://localhost:8000/admin");
      const data = await res.json();
      const user = data.find(u => u.email === userEmail);
      setEntries(user?.entries || []);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
      setMessage("Could not load entries.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("nickname", nickname);

    try {
      const res = await fetch("http://localhost:8000/entry", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ ${data.detail || data.error}`);
      } else {
        setMessage(`✅ ${data.message}`);
        setNickname('');
        fetchEntries(email); // Refresh list
      }
    } catch (err) {
      console.error("Failed to create entry:", err);
      setMessage("❌ Could not connect to backend.");
    }
  };

  return (
    <div>
      <h2>Create a New Entry</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Entry nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        <button type="submit" style={{ marginLeft: "10px" }}>Create Entry</button>
      </form>

      {message && <p style={{ marginTop: "15px", fontWeight: "bold" }}>{message}</p>}

      <hr style={{ margin: "30px 0" }} />

      <h3>Your Entries</h3>
      {entries.length === 0 ? (
        <p>You don't have any entries yet.</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.nickname}</strong> — ID: {entry.id}, Verified: {entry.verified ? '✅' : '❌'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}