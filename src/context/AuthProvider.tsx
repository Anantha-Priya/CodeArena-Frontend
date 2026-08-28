import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { AuthContext } from './AuthContext';

const TOKEN_STORAGE_KEY = 'codearena_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy initializer runs synchronously during render, before any child's mount
  // effect — so the API client already has the persisted token attached to it
  // before the first request (e.g. Home's health check) can go out.
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    setAuthToken(stored);
    return stored;
  });
  const navigate = useNavigate();

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      navigate('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  function login(newToken: string) {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: token !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
