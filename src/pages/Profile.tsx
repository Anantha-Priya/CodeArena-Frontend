import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listContests } from '../api/contests';
import { listMySubmissions } from '../api/submissions';
import { listProblems } from '../api/problems';
import { getMe, listUsers } from '../api/users';
import { ErrorBanner } from '../components/ErrorBanner';
import { CONTESTS_JOINED_ICON, PROBLEMS_SOLVED_ICON, RATING_ICON } from '../components/icons';
import { ListSkeleton } from '../components/ListSkeleton';
import type { Submission } from '../types/submission';
import type { UserProfile } from '../types/user';
import { getInitials } from '../utils/initials';

// recharts is a meaningful chunk of code for one chart — load it only when Profile is
// actually visited instead of bundling it into the app's main chunk.
const SubmissionStatusChart = lazy(() =>
  import('../components/SubmissionStatusChart').then((module) => ({ default: module.SubmissionStatusChart })),
);
const UserActivityChart = lazy(() =>
  import('../components/UserActivityChart').then((module) => ({ default: module.UserActivityChart })),
);

type LoadState = 'loading' | 'loaded' | 'error';

const TOTAL_PROBLEMS_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const TOTAL_USERS_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoadState, setSubmissionsLoadState] = useState<LoadState>('loading');
  const [totalProblems, setTotalProblems] = useState<number | null>(null);
  const [totalContests, setTotalContests] = useState<number | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[] | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    // Platform-wide total, reused (not re-fetched with new logic) from the same
    // page-size-1 trick Home uses — feeds the "problems solved out of X available"
    // highlight below. Non-fatal: the highlight just shows the raw count if this fails.
    listProblems({ size: 1 })
      .then((page) => {
        if (!cancelled) setTotalProblems(page.totalElements);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Admin-only endpoint (GET /api/users) — wait until the role is known so a regular
    // user's page never fires a request that would just 403.
    if (!profile || profile.role !== 'ADMIN') return;

    let cancelled = false;

    Promise.all([listContests(), listUsers()])
      .then(([contests, users]) => {
        if (!cancelled) {
          setTotalContests(contests.length);
          setAllUsers(users);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (loadState === 'error') {
    return <ErrorBanner message="Couldn't load your profile. Please try again." />;
  }

  if (loadState === 'loading' || !profile) {
    return <ListSkeleton rows={4} />;
  }

  const coveragePct =
    totalProblems && totalProblems > 0 ? Math.min(100, (profile.problemsSolved / totalProblems) * 100) : null;

  return (
    <div className="profile-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb__sep" aria-hidden="true">
          /
        </span>
        <span className="breadcrumb__current">Profile</span>
      </nav>

      <header className="profile-header">
        <div className="profile-header__identity">
          <div className="profile-avatar" aria-hidden="true">
            {getInitials(profile.username)}
          </div>
          <div>
            <h1 className="profile-header__name">{profile.username}</h1>
            <span className={`badge profile-header__role-badge badge--role-${profile.role.toLowerCase()}`}>
              {profile.role === 'ADMIN' ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>
        <div className="profile-header__actions">
          {profile.role === 'ADMIN' ? (
            <>
              <Link to="/admin/problems" className="button-link button-link--secondary">
                Create Problem
              </Link>
              <Link to="/admin/contests" className="button-link button-link--secondary">
                Create Contest
              </Link>
            </>
          ) : (
            <>
              <Link to="/problems" className="button-link button-link--secondary">
                Browse Problems
              </Link>
              <Link to="/submissions/my" className="button-link button-link--secondary">
                My Submissions
              </Link>
            </>
          )}
        </div>
      </header>

      {profile.role === 'ADMIN' ? (
        <div className="profile-admin-dashboard">
          <section className="profile-card card-shine profile-admin-dashboard__chart">
            <h2>User Activity</h2>
            {allUsers === null ? (
              <ListSkeleton rows={3} />
            ) : (
              <Suspense fallback={<ListSkeleton rows={3} />}>
                <UserActivityChart
                  activeCount={allUsers.filter((u) => u.problemsSolved >= 1).length}
                  nonActiveCount={allUsers.filter((u) => u.problemsSolved === 0).length}
                />
              </Suspense>
            )}
          </section>

          <section className="profile-card card-shine profile-dashboard__metrics">
            <h2>Stats</h2>
            <ul className="profile-metric-list">
              <li className="profile-metric">
                <span className="profile-metric__icon">{TOTAL_PROBLEMS_ICON}</span>
                <span className="profile-metric__label">Total Problems</span>
                <span className="profile-metric__value">{totalProblems ?? '—'}</span>
              </li>
              <li className="profile-metric">
                <span className="profile-metric__icon">{CONTESTS_JOINED_ICON}</span>
                <span className="profile-metric__label">Total Contests</span>
                <span className="profile-metric__value">{totalContests ?? '—'}</span>
              </li>
              <li className="profile-metric">
                <span className="profile-metric__icon">{TOTAL_USERS_ICON}</span>
                <span className="profile-metric__label">Total Users</span>
                <span className="profile-metric__value">{allUsers?.length ?? '—'}</span>
              </li>
            </ul>
          </section>
        </div>
      ) : (
        <div className="profile-dashboard">
          <section className="profile-card card-shine profile-dashboard__chart">
            <h2>Submission Breakdown</h2>
            {submissionsLoadState === 'loading' && <ListSkeleton rows={3} />}
            {submissionsLoadState === 'error' && (
              <ErrorBanner message="Couldn't load your submission history. Please try again." />
            )}
            {submissionsLoadState === 'loaded' && (
              <Suspense fallback={<ListSkeleton rows={3} />}>
                <SubmissionStatusChart submissions={submissions} problemsSolved={profile.problemsSolved} />
              </Suspense>
            )}
          </section>

          <section className="profile-card card-shine profile-dashboard__metrics">
            <h2>Stats</h2>
            <ul className="profile-metric-list">
              <li className="profile-metric">
                <span className="profile-metric__icon">{RATING_ICON}</span>
                <span className="profile-metric__label">Rating</span>
                <span className="profile-metric__value">{profile.rating}</span>
              </li>
              <li className="profile-metric">
                <span className="profile-metric__icon">{PROBLEMS_SOLVED_ICON}</span>
                <span className="profile-metric__label">Problems Solved</span>
                <span className="profile-metric__value">{profile.problemsSolved}</span>
              </li>
              <li className="profile-metric">
                <span className="profile-metric__icon">{CONTESTS_JOINED_ICON}</span>
                <span className="profile-metric__label">Contests Joined</span>
                <span className="profile-metric__value">{profile.contestsJoined}</span>
              </li>
            </ul>
          </section>

          <section className="profile-card card-shine profile-dashboard__highlight">
            <span className="profile-highlight__label">Problems Solved</span>
            <span className="profile-highlight__value">{profile.problemsSolved}</span>
            {coveragePct !== null && (
              <>
                <div className="profile-highlight__bar">
                  <div className="profile-highlight__bar-fill" style={{ width: `${coveragePct}%` }} />
                </div>
                <span className="profile-highlight__caption">
                  {profile.problemsSolved} of {totalProblems} problems on CodeArena
                </span>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
