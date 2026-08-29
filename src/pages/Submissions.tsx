import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMySubmissions } from '../api/submissions';
import { BackButton } from '../components/BackButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { ListSkeleton } from '../components/ListSkeleton';
import type { Submission } from '../types/submission';

type LoadState = 'loading' | 'loaded' | 'error';

export default function Submissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;

    listMySubmissions()
      .then((result) => {
        if (cancelled) return;
        setSubmissions(result);
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
      <BackButton fallback="/" label="Home" />

      <h1>My Submissions</h1>

      {loadState === 'loading' && <ListSkeleton />}
      {loadState === 'error' && <ErrorBanner message="Couldn't load your submissions. Please try again." />}

      {loadState === 'loaded' &&
        (submissions.length === 0 ? (
          <p className="empty-state">You haven&apos;t submitted anything yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Contest</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <Link to={`/problems/${submission.problemId}`}>{submission.problemTitle}</Link>
                    </td>
                    <td>
                      <Link to={`/contests/${submission.contestId}`}>{submission.contestTitle}</Link>
                    </td>
                    <td>{submission.language}</td>
                    <td>
                      <span className={`submission-status submission-status--${submission.status.toLowerCase()}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td>{submission.score}</td>
                    <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
