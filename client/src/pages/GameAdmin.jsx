import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function GameAdmin() {
  const { email } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch users when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8000/admin/users", {
          headers: {
            "Content-Type": "application/json",
            "X-User-Email": email, // 🛡 Required by FastAPI backend
          },
        });

        const data = await res.json();
        console.log("Fetched admin data:", data);

        if (!Array.isArray(data)) {
          throw new Error("Admin endpoint did not return a valid user list");
        }

        setUsers(data);
      } catch (err) {
        console.error("Error loading users:", err);
        setError("You must be an admin to view this page.");
      }
    };

    if (email) {
      fetchData();
    }
  }, [email]);

  // Handle role change
  const handleRoleChange = async (userEmail, newRole) => {
    try {
      const formData = new FormData();
      formData.append("email", userEmail);
      formData.append("role", newRole);

      const res = await fetch("http://localhost:8000/update-role", {
        method: "POST",
        headers: {
          "X-User-Email": email,
        },
        body: formData,
      });

      const data = await res.json();
      console.log("Role updated:", data);

      if (!res.ok) {
        throw new Error(data.detail || "Failed to update role");
      }

      setMessage(`Role for ${userEmail} updated to ${newRole}`);

      // Refresh the user list
      setUsers((prev) =>
        prev.map((u) =>
          u.email === userEmail ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      console.error("Role update error:", err);
      setError(`Failed to update role for ${userEmail}`);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🔒 Manage User Roles</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Change Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.email}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) =>
                    handleRoleChange(u.email, e.target.value)
                  }
                >
                  <option value="player">player</option>
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}