import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [email, setEmail] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const storedEmail = localStorage.getItem("userEmail");
        const storedRole = localStorage.getItem("userRole");

        if (storedEmail) setEmail(storedEmail);
        if (storedRole) setUserRole(storedRole); 
    }, []);

    const login = (email, role) => {
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", role)
        setEmail(email);
        setUserRole(role);
    };

    const logout = () => {
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");  
        setEmail(null);
        setUserRole(null);
    };

    return (
        <AuthContext.Provider value={{ email, userRole, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);