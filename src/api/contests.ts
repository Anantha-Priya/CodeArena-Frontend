import { apiClient } from './client';
import type { Contest, ContestStatusInfo } from '../types/contest';
import type { Problem } from '../types/problem';

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

// Plain array of full ProblemResponse objects, not paginated. 200 + [] (not 404) if the
// contest exists but has no problems attached yet — see API_REFERENCE.md.
export function getContestProblems(id: string): Promise<Problem[]> {
  return apiClient.get(`/api/contests/${id}/problems`);
}
