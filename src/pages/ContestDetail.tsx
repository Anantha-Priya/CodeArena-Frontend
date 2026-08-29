import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { getContest, getContestProblems, joinContest } from '../api/contests';
import { getErrorMessage } from '../api/errors';
import { BackButton } from '../components/BackButton';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { ErrorBanner } from '../components/ErrorBanner';
import { ListSkeleton } from '../components/ListSkeleton';
import { StatusPill } from '../components/StatusPill';
import { formatCountdown, useContestStatus } from '../hooks/useContestStatus';
import type { Contest } from '../types/contest';
import type { Problem } from '../types/problem';

type LoadState = 'loading' | 'loaded' | 'not-found' | 'error';
type ProblemsLoadState = 'loading' | 'loaded' | 'error';

interface JoinMessage {
  type: 'error' | 'info';
  text: string;
}

export default function ContestDetail() {
  const { id } = useParams<{ id: string }>();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemsLoadState, setProblemsLoadState] = useState<ProblemsLoadState>('loading');
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState<JoinMessage | null>(null);
  const { status, remainingSeconds, hasJoined, refetch } = useContestStatus(id ?? '');

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

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    getContestProblems(id)
      .then((result) => {
        if (cancelled) return;
        setProblems(result);
        setProblemsLoadState('loaded');
      })
      .catch(() => {
        if (!cancelled) setProblemsLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleJoin() {
    if (!id) return;

    setJoining(true);
    setJoinMessage(null);

    try {
      await joinContest(id);
      // Resync immediately rather than waiting for the next scheduled poll, so the
      // button flips to "Joined" right away.
      refetch();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setJoinMessage({ type: 'info', text: 'You’ve already joined this contest.' });
        refetch(); // our local hasJoined was stale — resync it too
      } else if (err instanceof ApiError && err.status === 400) {
        setJoinMessage({ type: 'error', text: err.message });
      } else {
        setJoinMessage({ type: 'error', text: getErrorMessage(err) });
      }
    } finally {
      setJoining(false);
    }
  }

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
    return <ErrorBanner message="Couldn't load this contest. Please try again." />;
  }

  if (loadState === 'loading' || !contest) {
    return <ListSkeleton rows={4} />;
  }

  return (
    <div className="contest-detail">
      <BackButton fallback="/contests" label="Contests" />

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

      <div className="contest-detail__join">
        {hasJoined === true && (
          <button type="button" className="button--secondary" disabled>
            Joined
          </button>
        )}
        {hasJoined === false && status !== 'ENDED' && (
          <button type="button" onClick={handleJoin} disabled={joining}>
            {joining ? 'Joining…' : 'Join Contest'}
          </button>
        )}
        {joinMessage && (
          <p className={`banner ${joinMessage.type === 'error' ? 'banner--error' : 'banner--info'}`}>
            {joinMessage.text}
          </p>
        )}
      </div>

      <p className="contest-detail__leaderboard-link">
        <Link to={`/contests/${contest.id}/leaderboard`}>View Leaderboard</Link>
      </p>

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

      <section className="contest-detail__problems">
        <h2>Problems</h2>

        {problemsLoadState === 'loading' && <ListSkeleton rows={2} />}

        {problemsLoadState === 'error' && (
          <ErrorBanner message="Couldn't load this contest's problems. Please try again." />
        )}

        {problemsLoadState === 'loaded' &&
          (problems.length === 0 ? (
            <p className="empty-state">No problems have been added to this contest yet.</p>
          ) : (
            <ul className="problem-list">
              {problems.map((problem) => (
                <li key={problem.id} className="problem-card">
                  <Link to={`/problems/${problem.id}?contestId=${contest.id}`} className="problem-card__link">
                    <span className="problem-card__title">{problem.title}</span>
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <span className="problem-card__topic">{problem.topic}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
      </section>
    </div>
  );
}
