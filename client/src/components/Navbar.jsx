import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { email, userRole, logout } = useAuth();
    const navigate = useNavigate();

    console.log("Navbar:", { email, userRole });

    return (
        <nav style={{ padding: "1rem", background: "#eee", marginBottom: "1rem" }}>
            <Link to="/" style={{ marginRight: "1rem" }}>Home</Link>
            {email ? (
                <>
                    <Link to="/entry" style={{ marginRight: "1rem" }}>Create Entry</Link>
                    <Link to="/pick" style={{ marginRight: "1rem" }}>My Picks</Link>
                    {(userRole === "manager" || userRole === "admin") && (
                        <Link to="/admin" style={{ marginRight: "1rem" }}>  Users
                        </Link>
                    )}
                    {userRole === "admin" && (
                        <Link to="/admin/game" style={{ marginRight: "1rem"}}>
                            Manage Roles
                        </Link>
                    )}
                    {userRole === "admin" && (
                        <Link to="/teams" style={{ marginRight: "1rem" }}>
                            Teams
                        </Link>
                    )}
                    <button
                        onClick={() => {
                            logout();
                            navigate("/");
                        }}
                        >
                        Log Out
                    </button>
                </>
            ) : (
                <>
                    <Link to="/register">Register</Link>
                </>
            )}
        </nav>
    );
}