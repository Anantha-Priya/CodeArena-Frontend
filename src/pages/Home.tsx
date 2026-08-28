import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHealth } from '../api/health';
import { useAuth } from '../hooks/useAuth';

type HealthState = 'checking' | 'up' | 'unreachable';

export default function Home() {
  const [health, setHealth] = useState<HealthState>('checking');
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then(() => {
        if (!cancelled) setHealth('up');
      })
      .catch(() => {
        if (!cancelled) setHealth('unreachable');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1>CodeArena</h1>
      <p className={`health health--${health}`}>
        {health === 'checking' && 'Checking backend…'}
        {health === 'up' && 'Backend: UP'}
        {health === 'unreachable' && 'Backend: unreachable'}
      </p>
      {/* Real navbar with auth-aware nav links lands in Phase 3 — this is a stand-in
          just so login/logout is reachable and testable in the meantime. */}
      {isAuthenticated ? (
        <button type="button" onClick={logout}>
          Log out
        </button>
      ) : (
        <p>
          <Link to="/login">Log in</Link> or <Link to="/register">Register</Link>
        </p>
      )}
    </div>
  );
}
