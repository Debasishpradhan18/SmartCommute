import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

interface UserState {
  id: string;
  email: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserState | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Load auth status from localStorage on startup
    const storedToken = localStorage.getItem('smartcommute_token');
    const storedUser = localStorage.getItem('smartcommute_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsInitializing(false);
  }, []);

  const handleAuthSuccess = (newToken: string, newUser: UserState) => {
    localStorage.setItem('smartcommute_token', newToken);
    localStorage.setItem('smartcommute_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('smartcommute_token');
    localStorage.removeItem('smartcommute_user');
    setToken(null);
    setUser(null);
  };

  if (isInitializing) {
    return (
      <div style={{
        backgroundColor: '#0B0F19',
        color: '#FFFFFF',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif'
      }}>
        <div>Loading SmartCommute...</div>
      </div>
    );
  }

  return (
    <>
      {token && user ? (
        <Dashboard user={user} token={token} onLogout={handleLogout} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
}
