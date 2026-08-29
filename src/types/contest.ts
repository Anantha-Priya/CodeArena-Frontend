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

// Matches the backend's ContestRequest. startTime/endTime are "YYYY-MM-DDTHH:mm:ss" with
// no timezone offset — the backend compares them directly against its own local clock with
// no zone conversion, so these must stay plain local wall-clock strings end to end (see
// API_REFERENCE.md's gotcha on this).
export interface ContestPayload {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}
