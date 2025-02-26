// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';

// Create the AuthContext
export const AuthContext = createContext();

// Create a Provider component
export const AuthProvider = ({ children }) => {
    // Initialize state from localStorage
    const [auth, setAuth] = useState({
        token: localStorage.getItem('token') || null,
        user: null,
    });

    // When the token changes, decode it to extract user info (if available)
    useEffect(() => {
        if (auth.token) {
            try {
                const decoded = jwtDecode(auth.token);
                // Assume the payload contains a "user" object with a "type" field
                setAuth((prev) => ({ ...prev, user: decoded.user }));
            } catch (error) {
                console.error('Error decoding token:', error);
                // If decoding fails, clear authentication
                setAuth({ token: null, user: null });
            }
        } else {
            setAuth({ token: null, user: null });
        }
    }, [auth.token]);

    // Login helper: store token in localStorage and update state
    const login = (token) => {
        localStorage.setItem('token', token);
        setAuth({ token, user: jwtDecode(token).user });
    };

    // Logout helper: remove token from localStorage and clear state
    const logout = () => {
        localStorage.removeItem('token');
        setAuth({ token: null, user: null });
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
