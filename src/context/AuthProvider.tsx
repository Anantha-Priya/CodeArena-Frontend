import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../api/users';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import type { UserProfile } from '../types/user';
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // Runs on login and on a fresh page load with a persisted token, so the
  // navbar's role-aware links and username/rating are correct either way.
  // `user` is reset to null at the events that clear/replace the token
  // (login, logout, forced 401-logout below) rather than here, so a stale
  // previous user's data can't briefly show while a new fetch is in flight.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    getMe()
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        // A 401 here is already handled globally (clears token, redirects to
        // /login); any other failure just leaves `user` unset.
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      navigate('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  function login(newToken: string) {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setUser(null);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: token !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
