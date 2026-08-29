import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHealth } from '../api/health';
import { useAuth } from '../hooks/useAuth';

type HealthState = 'checking' | 'up' | 'unreachable';

const CODE_LINES = [
  'function twoSum(nums, target) {',
  '  const seen = new Map();',
  '  for (let i = 0; i < nums.length; i++) {',
  '    const need = target - nums[i];',
  '    if (seen.has(need)) return [seen.get(need), i];',
  '    seen.set(nums[i], i);',
  '  }',
  '}',
];

export default function Home() {
  const [health, setHealth] = useState<HealthState>('checking');
  const { user } = useAuth();

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
    <div className="home">
      <section className="home-hero">
        <div className="home-hero__copy">
          <h1>CodeArena</h1>
          {user && <p className="home-hero__welcome">Welcome back, {user.username}</p>}
          <p className="home-hero__tagline">
            Sharpen your skills, race the clock in live contests, and climb the leaderboard.
          </p>
          <div className="home-hero__actions">
            <Link to="/problems" className="button-link">
              Browse Problems
            </Link>
            <Link to="/contests" className="button-link button-link--secondary">
              View Contests
            </Link>
          </div>
          <p className={`health health--${health}`}>
            {health === 'checking' && 'Checking backend…'}
            {health === 'up' && 'Backend: UP'}
            {health === 'unreachable' && 'Backend: unreachable'}
          </p>
        </div>

        <div className="home-hero__terminal" aria-hidden="true">
          <div className="home-terminal">
            <div className="home-terminal__bar">
              <span className="home-terminal__dot home-terminal__dot--red" />
              <span className="home-terminal__dot home-terminal__dot--yellow" />
              <span className="home-terminal__dot home-terminal__dot--green" />
              <span className="home-terminal__title">two_sum.js</span>
            </div>
            <div className="home-terminal__body">
              {CODE_LINES.map((line, index) => (
                <div key={index} className="home-terminal__line">
                  {line}
                </div>
              ))}
              <div className="home-terminal__result">✓ Accepted · 12ms</div>
              <div className="home-terminal__prompt">
                $<span className="home-terminal__cursor" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
