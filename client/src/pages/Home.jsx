import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import { useAuth } from "../context/AuthContext";
import CountdownTimer from '../components/CountdownTimer';

export default function Home() {
  const { email } = useAuth();
  const [error, setError] = useState("");
  const upcomingWeeks = [1, 2, 3];

  return (
    <div>
      <h1>Welcome to the Office Survivor Pool!</h1>
      {email ? (
        <p>You are logged in as <strong>{email}</strong></p>
      ) : (
        <LoginForm />
      )}
      <h3>⏳ Weekly Pick Deadlines</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Week</th>
            <th>Deadline (UTC)</th>
            <th>Time Remaining</th>
          </tr>
        </thead>
        <tbody>
          {upcomingWeeks.map(week => {
            const deadline = new Date(Date.UTC(2025, 5, 8 + (week - 1) * 7, 18, 0)); // Sunday 1pm ET = 18:00 UTC
            return (
              <tr key={week}>
                <td>Week {week}</td>
                <td>{deadline.toUTCString()}</td>
                <td><CountdownTimer week={week} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}