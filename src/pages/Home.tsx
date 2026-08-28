import { useEffect, useState } from 'react';
import { getHealth } from '../api/health';

type HealthState = 'checking' | 'up' | 'unreachable';

export default function Home() {
  const [health, setHealth] = useState<HealthState>('checking');

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
    </div>
  );
}
