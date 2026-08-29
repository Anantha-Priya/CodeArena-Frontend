import { useEffect, useState } from 'react';
import { getContestStatus } from '../api/contests';
import type { ContestStatus, ContestStatusInfo } from '../types/contest';

const POLL_INTERVAL_MS = 7000; // within the guide's 5-10s window

type LoadState = 'loading' | 'loaded' | 'error';

interface UseContestStatusResult {
  status: ContestStatus | null;
  remainingSeconds: number | null;
  loadState: LoadState;
}

// Polls GET /api/contests/{id}/status on an interval — status is always what the
// server last reported, never computed from the client's own clock. Between polls,
// remainingSeconds ticks down locally once a second purely for a smooth countdown
// display; the next poll's server value always overwrites it.
export function useContestStatus(contestId: string): UseContestStatusResult {
  const [statusInfo, setStatusInfo] = useState<ContestStatusInfo | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    if (!contestId) return;

    let cancelled = false;

    function poll() {
      getContestStatus(contestId)
        .then((info) => {
          if (cancelled) return;
          setStatusInfo(info);
          setRemainingSeconds(info.remainingSeconds);
          setLoadState('loaded');
        })
        .catch(() => {
          if (!cancelled) setLoadState('error');
        });
    }

    poll();
    const pollId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollId);
    };
  }, [contestId]);

  useEffect(() => {
    if (!statusInfo || statusInfo.status === 'ENDED') return;

    const tickId = setInterval(() => {
      setRemainingSeconds((current) => (current !== null && current > 0 ? current - 1 : current));
    }, 1000);

    return () => clearInterval(tickId);
  }, [statusInfo]);

  return { status: statusInfo?.status ?? null, remainingSeconds, loadState };
}

export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
