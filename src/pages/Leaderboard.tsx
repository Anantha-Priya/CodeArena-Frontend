import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { getContest, getContestLeaderboard } from '../api/contests';
import { ErrorBanner } from '../components/ErrorBanner';
import { ListSkeleton } from '../components/ListSkeleton';
import { useAuth } from '../hooks/useAuth';
import type { LeaderboardEntry } from '../types/leaderboard';

type LoadState = 'loading' | 'loaded' | 'not-found' | 'error';

export default function Leaderboard() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [contestTitle, setContestTitle] = useState<string | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoadState('loading');

    getContestLeaderboard(id)
      .then((result) => {
        if (cancelled) return;
        setEntries(result);
        setLoadState('loaded');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
          setLoadState('not-found');
        } else {
          setLoadState('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    getContest(id)
      .then((result) => {
        if (!cancelled) setContestTitle(result.title);
      })
      .catch(() => {
        // Non-fatal — the "#<id>" fallback below still lets the leaderboard render.
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loadState === 'not-found') {
    return (
      <div>
        <h1>Contest not found</h1>
        <p>We couldn&apos;t find a contest with that id.</p>
        <Link to="/contests">Back to Contests</Link>
      </div>
    );
  }

  if (loadState === 'error') {
    return <ErrorBanner message="Couldn't load the leaderboard. Please try again." />;
  }

  return (
    <div>
      <h1>Leaderboard{contestTitle ? `: ${contestTitle}` : ''}</h1>
      <p>
        <Link to={`/contests/${id}`}>Back to contest</Link>
      </p>

      {loadState === 'loading' && <ListSkeleton rows={4} />}

      {loadState === 'loaded' &&
        (entries.length === 0 ? (
          <p className="empty-state">No one has joined this contest yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Username</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.username}
                    className={entry.username === user?.username ? 'leaderboard-row--me' : undefined}
                  >
                    <td>{entry.rank}</td>
                    <td>{entry.username}</td>
                    <td>{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
