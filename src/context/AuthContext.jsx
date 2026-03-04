import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth
    const storedUser = localStorage.getItem('priority-list-user');
    const storedToken = localStorage.getItem('priority-list-token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      // Optionally validate token with server
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    localStorage.setItem('priority-list-token', data.token);
    localStorage.setItem('priority-list-user', JSON.stringify(data.user));
    setUser(data.user);
    
    return data.user;
  };

  const register = async (email, password, name) => {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', email, password, name })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    localStorage.setItem('priority-list-token', data.token);
    localStorage.setItem('priority-list-user', JSON.stringify(data.user));
    setUser(data.user);
    
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('priority-list-token');
    localStorage.removeItem('priority-list-user');
    setUser(null);
  };

  const getToken = () => localStorage.getItem('priority-list-token');

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
