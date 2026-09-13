import React, { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import Dashboard from './components/Dashboard';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLoginSuccess = (newToken, newUser) => {
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard token={token} user={user} onLogout={handleLogout} />;
}
