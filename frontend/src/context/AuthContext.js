import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => {
    const stored = localStorage.getItem('KNOWva_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token,   setToken]   = useState(() => localStorage.getItem('KNOWva_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (token) {
        try {
          const { data } = await authAPI.getMe();
          setUser(data);
          localStorage.setItem('KNOWva_user', JSON.stringify(data));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    verify();
  }, []);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('KNOWva_user',  JSON.stringify(userData));
    localStorage.setItem('KNOWva_token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('KNOWva_user');
    localStorage.removeItem('KNOWva_token');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('KNOWva_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
