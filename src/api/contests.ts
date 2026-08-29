import { apiClient } from './client';
import type { Contest, ContestStatusInfo } from '../types/contest';

// Plain array, not paginated — see API_REFERENCE.md's gotchas section.
export function listContests(): Promise<Contest[]> {
  return apiClient.get('/api/contests');
}

export function getContest(id: string): Promise<Contest> {
  return apiClient.get(`/api/contests/${id}`);
}

export function getContestStatus(id: string): Promise<ContestStatusInfo> {
  return apiClient.get(`/api/contests/${id}/status`);
}
