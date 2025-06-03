import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { email, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <nav style={{ padding: "1rem", background: "#eee", marginBottom: "1rem" }}>
            <Link to="/" style={{ marginRight: "1rem" }}>Home</Link>
            {email ? (
                <>
                    <Link to="/entry" style={{ marginRight: "1rem" }}>Create Entry</Link>
                    <Link to="/pick" style={{ marginRight: "1rem" }}>My Picks</Link>
                    <Link to="/admin" style={{ marginRight: "1rem" }}>Admin</Link>
                    <Link to="/teams" style={{ marginRight: "1rem" }}>Teams</Link>
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
                    {!email && <Link to="/login">Log In</Link>}
                </>
            )}
        </nav>
    );
}