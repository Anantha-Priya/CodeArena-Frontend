import type { ContestStatus } from '../types/contest';

export function StatusPill({ status }: { status: ContestStatus }) {
  return <span className={`badge badge--contest-${status.toLowerCase()}`}>{status}</span>;
}
