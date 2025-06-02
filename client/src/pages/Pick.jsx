import React, { useEffect, useState } from "react";

export default function Pick() {
  const [entries, setEntries] = useState([]);
  const [teams, setTeams] = useState([]);
  const [existingPicks, setExistingPicks] = useState([]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState({});

  // Lock logic: Sunday 1PM ET (18:00 UTC)
  const isWeekLocked = (week) => {
    const baseDeadline = new Date(Date.UTC(2025, 8, 7, 18, 0)); // Sept 7, 2025
    const deadline = new Date(
      baseDeadline.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000
    );
    return new Date() > deadline;
  };

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      setMessage("You must be logged in to make picks.");
      return;
    }
    setEmail(userEmail);

    fetchEntries(userEmail);
    fetchTeams();
    fetchPicks(userEmail);
  }, []);

  const fetchEntries = async (email) => {
    const res = await fetch(`http://localhost:8000/entries?email=${email}`);
    const data = await res.json();
    console.log("Entries API response:", data);
    if (!Array.isArray(data)) {
      console.error("Expected array but got:", data);
      setMessage(data.detail || "Failed to load entries");
      return;
    }
    setEntries(data.filter((entry) => entry.verified));
  };

  const fetchTeams = async () => {
    const res = await fetch("http://localhost:8000/teams");
    const data = await res.json();
    setTeams(data);
  };

  const fetchPicks = async (email) => {
    const res = await fetch(`http://localhost:8000/picks?email=${email}`);
    const data = await res.json();
    console.log("Fetched picks:", data);
    setExistingPicks(data);
  };

  const handleSubmit = async (entryId, week, team) => {
    if (!week || !team) {
      setMessage("Please select both week and team.");
      return;
    }

    const formData = new FormData();
    formData.append("entry_id", entryId);
    formData.append("week", week);
    formData.append("team", team);

    const res = await fetch("http://localhost:8000/pick", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      fetchPicks(email);
    } else {
      setMessage(data.error || "Something went wrong.");
    }
  };

  const handleEdit = async (pickId, week, team) => {
    const formData = new FormData();
    formData.append("week", week);
    formData.append("team", team);

    const res = await fetch(`http://localhost:8000/pick/${pickId}`, {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      fetchPicks(email);
    } else {
      setMessage(data.detail || "Edit failed.");
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
                  <button 
                    onClick={() => handleSubmit(entry.id)}>
                    Submit Pick
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>📝 Existing Picks</h3>
      <table border="1" cellPadding="8" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Entry</th>
            <th>Week</th>
            <th>Team</th>
            <th>Save</th>
          </tr>
        </thead>
        <tbody>
          {existingPicks.map((pick) => (
            <tr key={pick.id}>
              <td>{pick.entry_nickname}</td>
              <td>
                <input
                  type="number"
                  value={pick.week}
                  onChange={(e) =>
                    setExistingPicks((prev) =>
                      prev.map((p) =>
                        p.id === pick.id
                          ? { ...p, week: e.target.value }
                          : p
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
                        p.id === pick.id
                          ? { ...p, team: e.target.value }
                          : p
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
                <button
                  disabled={isWeekLocked(pick.week)}
                  style={{ opacity: isWeekLocked(pick.week) ? 0.5 : 1 }}
                  onClick={() =>
                    handleEdit(pick.id, pick.week, pick.team)
                  }
                >
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