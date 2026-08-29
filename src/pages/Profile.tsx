import { useEffect, useState } from 'react';
import { getMe } from '../api/users';
import type { UserProfile } from '../types/user';

type LoadState = 'loading' | 'loaded' | 'error';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');

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

  if (loadState === 'error') {
    return <p className="banner banner--error">Couldn&apos;t load your profile. Please try again.</p>;
  }

  if (loadState === 'loading' || !profile) {
    return <p>Loading profile…</p>;
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
    </div>
  );
}
