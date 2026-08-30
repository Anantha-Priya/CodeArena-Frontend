import { useEffect, useState } from 'react';
import { listUsers } from '../../api/users';
import { BackButton } from '../../components/BackButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { ListSkeleton } from '../../components/ListSkeleton';
import type { UserProfile } from '../../types/user';

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

  return (
    <div>
      <BackButton fallback="/" label="Home" />

      <h1>Coders</h1>

      {loadState === 'loading' && <ListSkeleton />}
      {loadState === 'error' && <ErrorBanner message="Couldn't load users. Please try again." />}

      {loadState === 'loaded' &&
        (users.length === 0 ? (
          <p className="empty-state">No users found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Rating</th>
                  <th>Problems Solved</th>
                  <th>Contests Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.username}>
                    <td>{user.username}</td>
                    <td>
                      <span className={`badge profile-header__role-badge badge--role-${user.role.toLowerCase()}`}>
                        {user.role === 'ADMIN' ? 'Admin' : 'Member'}
                      </span>
                    </td>
                    <td>{user.rating}</td>
                    <td>{user.problemsSolved}</td>
                    <td>{user.contestsJoined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
