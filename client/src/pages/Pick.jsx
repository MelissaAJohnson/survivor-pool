import React, { useState, useEffect } from 'react';

export default function Pick() {
  const [entries, setEntries] = useState([]);
  const [formState, setFormState] = useState({});
  const [teams, setTeams] = useState([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [existingPicks, setExistingPicks] = useState([]);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      setMessage("You must be logged in to make picks.");
      return;
    }

    setEmail(userEmail);
    fetchUserEntries(userEmail);
    fetchTeams();
    fetchPicks(userEmail);
  }, []);

  const fetchUserEntries = async (userEmail) => {
    try {
      const res = await fetch("http://localhost:8000/admin");
      const data = await res.json();
      const user = data.find(u => u.email === userEmail);
      const verifiedEntries = user?.entries.filter(e => e.verified) || [];
      setEntries(verifiedEntries);

      // Init form state
      const initialState = {};
      verifiedEntries.forEach(entry => {
        initialState[entry.id] = { week: '', team: '' };
      });
      setFormState(initialState);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
      setMessage("Could not load entries.");
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch("http://localhost:8000/teams");
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  };

  const fetchPicks = async (email) => {
    try {
      const res = await fetch(`http://localhost:8000/picks?email=${email}`);
      const data = await res.json();
      console.log("Fetched picks:", data);
      setExistingPicks(data);
    } catch (err) {
      console.error("Failed to fetch picks:", err);
    }
  }

  const handleInputChange = (entryId, field, value) => {
    setFormState(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (entryId) => {
    const { week, team } = formState[entryId];
    const formData = new URLSearchParams();
    formData.append("entry_id", entryId);
    formData.append("week", week);
    formData.append("team", team);

    try {
      const res = await fetch("http://localhost:8000/pick", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ Entry ${entryId}: ${data.error || data.detail}`);
      } else {
        setMessage(`✅ Entry ${entryId}: ${data.message}`);
        setFormState(prev => ({
          ...prev,
          [entryId]: { week: '', team: '' }
        }));
      }
    } catch (err) {
      console.error("Failed to submit pick:", err);
      setMessage("❌ Could not connect to backend.");
    }
  };

  const handleEdit = async (pickId, week, team) => {
    const formData = new URLSearchParams();
    formData.append("week", week);
    formData.append("team", team);

    const res = await fetch(`http://localhost:8000/pick/${pickId}`, {
      method: "PUT",
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
      fetchPicks(email);
    }
  };

  return (
    <div>
      <h2>Make Picks</h2>

      {message && <p style={{ fontWeight: "bold", marginBottom: "20px" }}>{message}</p>}

      {entries.length === 0 ? (
        <p>No verified entries found. You must be verified by the admin to submit picks.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Entry</th>
              <th>Week</th>
              <th>Team</th>
              <th>Submit</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id}>
                <td>{entry.nickname}</td>
                <td>
                  <input
                    type="number"
                    value={formState[entry.id]?.week || ''}
                    onChange={(e) =>
                      handleInputChange(entry.id, 'week', e.target.value)
                    }
                    min="1"
                    required
                  />
                </td>
                <td>
                  <select
                    value={formState[entry.id]?.team || ''}
                    onChange={(e) =>
                      handleInputChange(entry.id, 'team', e.target.value)
                    }
                    required
                  >
                    <option value="">-- Select Team --</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.name}>{team.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button onClick={() => handleSubmit(entry.id)}>
                    Submit Pick
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    <h2 style={{ marginTop: "40px" }}>Your Existing Picks</h2>
      <table>
        <thead>
          <tr>
            <th>Entry ID</th>
            <th>Week</th>
            <th>Team</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {existingPicks.map((pick) => (
            <tr key={pick.id}>
              <td>{pick.entry_id}</td>
              <td>
                <input
                  type="number"
                  value={pick.week}
                  onChange={(e) =>
                    setExistingPicks((prev) =>
                      prev.map((p) =>
                        p.id === pick.id ? { ...p, week: e.target.value } : p
                      )
                    )
                  }
                />
              </td>
              <td>
                <select
                  value={pick.team}
                  onChange={(e) =>
                    setExistingPicks((prev) =>
                      prev.map((p) =>
                        p.id === pick.id ? { ...p, team: e.target.value } : p
                      )
                    )
                  }
                >
                  <option value="">-- Select Team --</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button onClick={() => handleEdit(pick.id, pick.week, pick.team)}>
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}