import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHealth } from '../api/health';
import { listContests } from '../api/contests';
import { listProblems } from '../api/problems';
import { useAuth } from '../hooks/useAuth';

type HealthState = 'checking' | 'up' | 'unreachable';

interface PlatformStats {
  problems: number;
  contests: number;
}

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

const FEATURES = [
  {
    title: 'Practice Problems',
    description: 'Browse a growing set of problems across every difficulty, from warm-ups to real challenges.',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: 'Compete in Contests',
    description: 'Join live, timed contests with server-driven status — no fudging the clock, ever.',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
      </svg>
    ),
  },
  {
    title: 'Track Your Progress',
    description: 'Watch your rating, solved count, and submission history grow with every contest.',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 17 9 11 13 15 21 6" />
        <polyline points="14 6 21 6 21 13" />
      </svg>
    ),
  },
];

export default function Home() {
  const [health, setHealth] = useState<HealthState>('checking');
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
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

  useEffect(() => {
    let cancelled = false;

    // Real, already-available data (not fabricated) — a page-size-1 request just to
    // read totalElements, plus the plain contests array's own length.
    Promise.all([listProblems({ size: 1 }), listContests()])
      .then(([problemsPage, contests]) => {
        if (!cancelled) setPlatformStats({ problems: problemsPage.totalElements, contests: contests.length });
      })
      .catch(() => {
        // Non-fatal — the stats strip just doesn't render rather than showing a guess.
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

      {platformStats && (
        <section className="home-stats">
          <div className="home-stat">
            <span className="home-stat__value">{platformStats.problems}</span>
            <span className="home-stat__label">Problems Available</span>
          </div>
          <div className="home-stat">
            <span className="home-stat__value">{platformStats.contests}</span>
            <span className="home-stat__label">Contests Hosted</span>
          </div>
        </section>
      )}

      <section className="home-features">
        <h2 className="home-section-title">How It Works</h2>
        <div className="home-feature-cards">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="home-feature-card">
              <div className="home-feature-card__icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
