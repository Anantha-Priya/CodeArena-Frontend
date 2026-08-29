import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listContests } from '../api/contests';
import { ErrorBanner } from '../components/ErrorBanner';
import { ListSkeleton } from '../components/ListSkeleton';
import { StatusPill } from '../components/StatusPill';
import { useContestStatus } from '../hooks/useContestStatus';
import type { Contest } from '../types/contest';

type LoadState = 'loading' | 'loaded' | 'error';

// Each card polls its own status independently — this is exactly what the guide asks
// for ("poll while the page is open"), and fine at this project's contest-count scale.
function ContestCardStatus({ contestId }: { contestId: string }) {
  const { status } = useContestStatus(contestId);
  if (!status) return null;
  return <StatusPill status={status} />;
}

export default function Contests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;

    listContests()
      .then((result) => {
        if (cancelled) return;
        setContests(result);
        setLoadState('loaded');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1>Contests</h1>

      {loadState === 'loading' && <ListSkeleton />}
      {loadState === 'error' && <ErrorBanner message="Couldn't load contests. Please try again." />}

      {loadState === 'loaded' &&
        (contests.length === 0 ? (
          <p className="empty-state">No contests yet.</p>
        ) : (
          <ul className="contest-list">
            {contests.map((contest) => (
              <li key={contest.id} className="contest-card">
                <Link to={`/contests/${contest.id}`} className="contest-card__link">
                  <span className="contest-card__title">{contest.title}</span>
                  <ContestCardStatus contestId={String(contest.id)} />
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
