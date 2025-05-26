import React, { useState, useEffect } from 'react';

export default function TeamAdmin() {
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState('');
  const [editTeamId, setEditTeamId] = useState(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const res = await fetch("http://localhost:8000/teams");
    const data = await res.json();
    setTeams(data);
  };

  const createTeam = async () => {
    const formData = new URLSearchParams();
    formData.append("name", newTeam);
    const res = await fetch("http://localhost:8000/teams", {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setNewTeam('');
      fetchTeams();
    } else {
      setMessage(data.detail || data.error);
    }
  };

  const updateTeam = async (teamId) => {
    const formData = new URLSearchParams();
    formData.append("name", editTeamName);
    const res = await fetch(`http://localhost:8000/teams/${teamId}`, {
      method: "PUT",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setEditTeamId(null);
      setEditTeamName('');
      fetchTeams();
    } else {
      setMessage(data.detail || data.error);
    }
  };

  const deleteTeam = async (teamId) => {
    const res = await fetch(`http://localhost:8000/teams/${teamId}`, {
      method: "DELETE"
    });
    const data = await res.json();
    setMessage(data.message);
    fetchTeams();
  };

  return (
    <div>
      <h2>Team Management</h2>

      {message && <p><strong>{message}</strong></p>}

      <input
        type="text"
        placeholder="New team name"
        value={newTeam}
        onChange={(e) => setNewTeam(e.target.value)}
      />
      <button onClick={createTeam}>Add Team</button>

      <hr />

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(team => (
            <tr key={team.id}>
              <td>{team.id}</td>
              <td>
                {editTeamId === team.id ? (
                  <input
                    type="text"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                  />
                ) : (
                  team.name
                )}
              </td>
              <td>
                {editTeamId === team.id ? (
                  <>
                    <button onClick={() => updateTeam(team.id)}>Save</button>
                    <button onClick={() => setEditTeamId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => {
                      setEditTeamId(team.id);
                      setEditTeamName(team.name);
                    }}>
                      Edit
                    </button>
                    <button onClick={() => deleteTeam(team.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}