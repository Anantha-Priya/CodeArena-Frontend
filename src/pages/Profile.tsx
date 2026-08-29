import { lazy, Suspense, useEffect, useState } from 'react';
import { listMySubmissions } from '../api/submissions';
import { getMe } from '../api/users';
import { ErrorBanner } from '../components/ErrorBanner';
import { ListSkeleton } from '../components/ListSkeleton';
import type { Submission } from '../types/submission';
import type { UserProfile } from '../types/user';

// recharts is a meaningful chunk of code for one chart — load it only when Profile is
// actually visited instead of bundling it into the app's main chunk.
const SubmissionStatusChart = lazy(() =>
  import('../components/SubmissionStatusChart').then((module) => ({ default: module.SubmissionStatusChart })),
);

type LoadState = 'loading' | 'loaded' | 'error';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoadState, setSubmissionsLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;

    getMe()
      .then((result) => {
        if (cancelled) return;
        setProfile(result);
        setLoadState('loaded');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    listMySubmissions()
      .then((result) => {
        if (cancelled) return;
        setSubmissions(result);
        setSubmissionsLoadState('loaded');
      })
      .catch(() => {
        if (!cancelled) setSubmissionsLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadState === 'error') {
    return <ErrorBanner message="Couldn't load your profile. Please try again." />;
  }

  if (loadState === 'loading' || !profile) {
    return <ListSkeleton rows={4} />;
  }

  return (
    <div>
      <h1>Profile</h1>
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-card__label">Username</span>
          <span className="stat-card__value">{profile.username}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Rating</span>
          <span className="stat-card__value">{profile.rating}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Problems Solved</span>
          <span className="stat-card__value">{profile.problemsSolved}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Contests Joined</span>
          <span className="stat-card__value">{profile.contestsJoined}</span>
        </div>
      </div>

      <section className="profile-chart-section">
        <h2>Submission Breakdown</h2>
        {submissionsLoadState === 'loading' && <ListSkeleton rows={3} />}
        {submissionsLoadState === 'error' && (
          <ErrorBanner message="Couldn't load your submission history. Please try again." />
        )}
        {submissionsLoadState === 'loaded' && (
          <Suspense fallback={<ListSkeleton rows={3} />}>
            <SubmissionStatusChart submissions={submissions} />
          </Suspense>
        )}
      </section>
    </div>
  );
}
