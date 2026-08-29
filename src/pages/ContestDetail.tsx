import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { getContest } from '../api/contests';
import { StatusPill } from '../components/StatusPill';
import { formatCountdown, useContestStatus } from '../hooks/useContestStatus';
import type { Contest } from '../types/contest';

type LoadState = 'loading' | 'loaded' | 'not-found' | 'error';

export default function ContestDetail() {
  const { id } = useParams<{ id: string }>();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const { status, remainingSeconds } = useContestStatus(id ?? '');

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoadState('loading');

    getContest(id)
      .then((result) => {
        if (cancelled) return;
        setContest(result);
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
    return <p className="banner banner--error">Couldn&apos;t load this contest. Please try again.</p>;
  }

  if (loadState === 'loading' || !contest) {
    return <p>Loading contest…</p>;
  }

  return (
    <div className="contest-detail">
      <div className="contest-detail__header">
        <h1>{contest.title}</h1>
        {status && <StatusPill status={status} />}
      </div>

      {status && status !== 'ENDED' && remainingSeconds !== null && (
        <p className="contest-detail__countdown">
          {status === 'UPCOMING' ? 'Starts in ' : 'Ends in '}
          {formatCountdown(remainingSeconds)}
        </p>
      )}

      <p className="problem-detail__prose">{contest.description}</p>

      <dl className="contest-detail__meta">
        <div>
          <dt>Start</dt>
          <dd>{new Date(contest.startTime).toLocaleString()}</dd>
        </div>
        <div>
          <dt>End</dt>
          <dd>{new Date(contest.endTime).toLocaleString()}</dd>
        </div>
      </dl>

      {/* The backend currently has no way to fetch a contest's associated problems
          (no `problems` field on ContestResponse, no GET endpoint) — flagged, and per
          the call made, this section is left out until that's added. */}
    </div>
  );
}
