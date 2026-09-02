export interface Contest {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export type ContestStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED';

export interface ContestStatusInfo {
  status: ContestStatus;
  remainingSeconds: number;
  hasJoined: boolean;
}

// Matches the backend's ContestRequest. startTime/endTime are UTC ISO-8601 instants with a
// trailing Z (e.g. "2026-09-02T06:22:00Z") — the backend deserializes them as java.time.Instant,
// so any local wall-clock value must be converted to UTC before being sent (see API_REFERENCE.md).
export interface ContestPayload {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}
