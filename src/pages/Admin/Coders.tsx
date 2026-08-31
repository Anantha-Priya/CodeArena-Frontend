import { useEffect, useState } from 'react';
import { listUsers } from '../../api/users';
import { BackButton } from '../../components/BackButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { CONTESTS_JOINED_ICON, PROBLEMS_SOLVED_ICON, RATING_ICON } from '../../components/icons';
import { ListSkeleton } from '../../components/ListSkeleton';
import type { UserProfile } from '../../types/user';
import { getInitials } from '../../utils/initials';

type LoadState = 'loading' | 'loaded' | 'error';

export default function Coders() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;

    listUsers()
      .then((result) => {
        if (cancelled) return;
        setUsers(result);
        setLoadState('loaded');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Admins aren't coders — excluded from the leaderboard entirely, not just relabeled.
  // Problems Solved is the primary rank key (the thing a coder leaderboard is actually
  // about), Rating breaks ties.
  const ranked = users
    .filter((user) => user.role !== 'ADMIN')
    .sort((a, b) => b.problemsSolved - a.problemsSolved || b.rating - a.rating);
  const topCoder = ranked[0] ?? null;

  return (
    <div>
      <BackButton fallback="/" label="Home" />

      <h1>Coders</h1>

      {loadState === 'loading' && <ListSkeleton />}
      {loadState === 'error' && <ErrorBanner message="Couldn't load users. Please try again." />}

      {loadState === 'loaded' &&
        (ranked.length === 0 ? (
          <p className="empty-state">No coders found.</p>
        ) : (
          <div className="coders-layout">
            <div className="table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Coder</th>
                    <th>Rating</th>
                    <th>Problems Solved</th>
                    <th>Contests Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((user, index) => {
                    const rank = index + 1;
                    const isTopThree = rank <= 3;
                    return (
                      <tr key={user.username} className={isTopThree ? `coder-row coder-row--top-${rank}` : undefined}>
                        <td>
                          <span className={`coder-rank${isTopThree ? ` coder-rank--top-${rank}` : ''}`}>{rank}</span>
                        </td>
                        <td>
                          <div className="coder-identity">
                            <span className="coder-avatar" aria-hidden="true">
                              {getInitials(user.username)}
                            </span>
                            {user.username}
                          </div>
                        </td>
                        <td>{user.rating}</td>
                        <td>{user.problemsSolved}</td>
                        <td>{user.contestsJoined}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {topCoder && (
              <aside className="profile-card coders-spotlight">
                <span className="coders-spotlight__label">Top Coder</span>
                <div className="coders-spotlight__avatar" aria-hidden="true">
                  {getInitials(topCoder.username)}
                </div>
                <h2 className="coders-spotlight__name">{topCoder.username}</h2>
                <ul className="profile-metric-list">
                  <li className="profile-metric">
                    <span className="profile-metric__icon">{RATING_ICON}</span>
                    <span className="profile-metric__label">Rating</span>
                    <span className="profile-metric__value">{topCoder.rating}</span>
                  </li>
                  <li className="profile-metric">
                    <span className="profile-metric__icon">{PROBLEMS_SOLVED_ICON}</span>
                    <span className="profile-metric__label">Problems Solved</span>
                    <span className="profile-metric__value">{topCoder.problemsSolved}</span>
                  </li>
                  <li className="profile-metric">
                    <span className="profile-metric__icon">{CONTESTS_JOINED_ICON}</span>
                    <span className="profile-metric__label">Contests Joined</span>
                    <span className="profile-metric__value">{topCoder.contestsJoined}</span>
                  </li>
                </ul>
              </aside>
            )}
          </div>
        ))}
    </div>
  );
}
