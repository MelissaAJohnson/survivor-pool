import React, { useState, useEffect } from 'react';

export default function TeamResultsAdmin() {
  const [results, setResults] = useState([]);
  const [week, setWeek] = useState(1);
  const [team, setTeam] = useState('');
  const [result, setResult] = useState('win');
  const [message, setMessage] = useState('');

  const fetchResults = async () => {
    const userEmail = localStorage.getItem("userEmail");
    const res = await fetch("http://localhost:8000/team-results");
    const data = await res.json();
    setResults(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append("week", week);
    formData.append("team", team);
    formData.append("result", result);

    const res = await fetch("http://localhost:8000/team-result", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-User-Email": localStorage.getItem("userEmail"),
      },
    });

    const data = await res.json();
    setMessage(data.message);
    fetchResults();
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <div>
      <h2>🏈 Weekly Team Results</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Week"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
        />
        <input
          type="text"
          placeholder="Team"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        />
        <select value={result} onChange={(e) => setResult(e.target.value)}>
          <option value="win">Win</option>
          <option value="loss">Loss</option>
        </select>
        <button type="submit" style={{ marginLeft: '10px' }}>Submit</button>
      </form>

      {message && <p>{message}</p>}

      <h3>📋 Submitted Results</h3>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Week</th>
            <th>Team</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i}>
              <td>{r.week}</td>
              <td>{r.team}</td>
              <td>{r.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}