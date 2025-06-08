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

  const getTeamsPickedPerEntry = () => {
    const mapping = {};
    existingPicks.forEach((pick) => {
      if (!mapping[pick.entry_id]) {
        mapping[pick.entry_id] = new Set();
      }
      mapping[pick.entry_id].add(pick.team);
    });
    return mapping;
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
  
  const teamsPicked = getTeamsPickedPerEntry();
  const SEASON_START = new Date("2025-06-08");
  const currentWeek = getCurrentWeek();

  function getCurrentWeek() {
    const today = new Date();
    const diffInMs = today - SEASON_START;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffInDays / 7) + 1;
    return Math.max(1, weekNumber); //never less than Week 1
  }

  const handleSubmit = async (entry) => {
    const entryId = entry.id;
    const team = formState[entry.id]?.team;

    if (isWeekLocked(currentWeek)) {
      alert(`Week ${currentWeek} is locked - picks are closed.`);
      return;
    }
    if (!team) {
      setMessage("Please select team.");
      return;
    }

    const formData = new FormData();
    formData.append("entry_id", entryId);
    formData.append("week", currentWeek);
    formData.append("team", team);

    try {
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
    } catch (err) {
      console.error("Error submitting pick:", err);
      alert("Failed to submit pick. Please try again.");
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

  const handleInputChange = (entryId, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value,
      },
    }));
  };

  return (
    <div>
      <h2>Make Picks</h2>
      <p>Current Week: {currentWeek}</p>
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
                <td>{currentWeek}</td>
                <td>
                  <select
                    value={formState[entry.id]?.team || ''}
                    onChange={(e) =>
                      handleInputChange(entry.id, 'team', e.target.value)
                    }
                    required
                  >
                    <option value="">-- Select Team --</option>
                    {teams
                      .filter((team) => {
                        const picked = teamsPicked[entry.id];
                        return !picked || !picked.has(team.name);
                      })
                      .map((team) => (
                        <option key={team.id} value={team.name}>
                          {team.name}
                        </option>
                      ))}
                  </select>
                </td>
                <td>
                  <button 
                    disabled={isWeekLocked(formState[entry.id]?.week)}
                    style={{ opacity: isWeekLocked(formState[entry.id]?.week) ? 0.5 : 1 }}
                    onClick={() => 
                      handleSubmit(entry)}>
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
              <td>{pick.week}</td>
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