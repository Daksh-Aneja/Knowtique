import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  tenant_id: string;
  is_demo: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isAnalyst: boolean;
  canExecute: boolean; // ADMIN or ANALYST
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, loading: true,
  login: async () => ({ ok: false }),
  logout: () => {},
  isAdmin: false, isAnalyst: false, canExecute: false,
});

export const useAuth = () => useContext(AuthContext);

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8001/api/v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kaeos-token'));
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => { setToken(null); localStorage.removeItem('kaeos-token'); setLoading(false); });
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.detail || 'Invalid credentials' };
      }
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('kaeos-token', data.token);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kaeos-token');
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, logout,
      isAdmin: user?.role === 'ADMIN',
      isAnalyst: user?.role === 'ANALYST',
      canExecute: user?.role === 'ADMIN' || user?.role === 'ANALYST',
    }}>
      {children}
    </AuthContext.Provider>
  );
};
