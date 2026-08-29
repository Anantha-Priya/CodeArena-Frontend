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
}
