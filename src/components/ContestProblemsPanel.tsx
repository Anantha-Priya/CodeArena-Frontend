import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { attachProblemToContest, getContestProblems } from '../api/contests';
import { listProblems } from '../api/problems';
import type { Problem } from '../types/problem';
import { DifficultyBadge } from './DifficultyBadge';
import { ListSkeleton } from './ListSkeleton';

// Admin management, not the Phase 4 browsing UI — fetch every problem in one page.
const ALL_PROBLEMS_SIZE = 100;

type LoadState = 'loading' | 'loaded' | 'error';

export function ContestProblemsPanel({ contestId }: { contestId: number }) {
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [attachedIds, setAttachedIds] = useState<Set<number>>(new Set());
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [attachingId, setAttachingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');

    Promise.all([listProblems({ size: ALL_PROBLEMS_SIZE }), getContestProblems(String(contestId))])
      .then(([problemsPage, attached]) => {
        if (cancelled) return;
        setAllProblems(problemsPage.content);
        setAttachedIds(new Set(attached.map((problem) => problem.id)));
        setLoadState('loaded');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [contestId]);

  async function handleAttach(problemId: number) {
    setAttachingId(problemId);
    setError(null);

    try {
      await attachProblemToContest(contestId, problemId);
      setAttachedIds((current) => new Set(current).add(problemId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Already attached from elsewhere — just make sure our local state agrees.
        setAttachedIds((current) => new Set(current).add(problemId));
      } else if (err instanceof ApiError && err.status === 403) {
        setError('You are not authorized to perform this action.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to attach the problem.');
      }
    } finally {
      setAttachingId(null);
    }
  }

  if (loadState === 'loading') {
    return <ListSkeleton rows={3} />;
  }

  if (loadState === 'error') {
    return <p className="banner banner--error">Couldn&apos;t load problems. Please try again.</p>;
  }

  return (
    <div className="contest-problems-panel">
      {error && <p className="banner banner--error">{error}</p>}

      {allProblems.length === 0 ? (
        <p className="empty-state">No problems exist yet — create some in Admin: Problems first.</p>
      ) : (
        <ul className="problem-list">
          {allProblems.map((problem) => {
            const attached = attachedIds.has(problem.id);
            const attaching = attachingId === problem.id;

            return (
              <li key={problem.id} className="problem-card admin-problem-row">
                <span className="problem-card__title">{problem.title}</span>
                <DifficultyBadge difficulty={problem.difficulty} />
                <span className="problem-card__topic">{problem.topic}</span>
                <div className="admin-problem-row__actions">
                  <button
                    type="button"
                    className={attached ? 'button--secondary' : undefined}
                    disabled={attached || attaching}
                    onClick={() => handleAttach(problem.id)}
                  >
                    {attached ? 'Attached' : attaching ? 'Attaching…' : 'Attach'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
