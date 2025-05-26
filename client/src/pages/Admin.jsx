// client/src/pages/Admin.jsx
import React, { useEffect, useState } from 'react';

export default function Admin () {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8000/admin");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
  };

  const handleVerifyEntry = async (entryId) => {
    const formData = new URLSearchParams();
    formData.append("entry_id", entryId);
  
    try {
      const res = await fetch("http://localhost:8000/verify-entry", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
  
      const data = await res.json();
      console.log(data.message || data.error);
      fetchUsers(); // refresh the table
    } catch (err) {
      console.error("Verification failed:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h2>Admin Panel</h2>
      {users.map(user => (
        <div key={user.email} style={{ marginBottom: '30px' }}>
          <h3>{user.email}</h3>
          {user.entries.length === 0 ? (
            <p>No entries</p>
          ) : (
            <ul>
              {user.entries.map(entry => (
                <li key={entry.id}>
                  <strong>{entry.nickname}</strong> (ID: {entry.id}) - Verified: {entry.verified ? "✅" : "❌"}
                  {!entry.verified && (
                    <button style={{ marginLeft: "10px" }} onClick={() => handleVerifyEntry(entry.id)}>Verify
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}