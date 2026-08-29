import { apiClient } from './client';
import type { Contest, ContestPayload, ContestStatusInfo } from '../types/contest';
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

export function joinContest(id: string): Promise<void> {
  return apiClient.post(`/api/contests/${id}/join`);
}

export function createContest(payload: ContestPayload): Promise<Contest> {
  return apiClient.post('/api/contests', payload);
}

export function attachProblemToContest(contestId: number, problemId: number): Promise<void> {
  return apiClient.post(`/api/contests/${contestId}/problems/${problemId}`);
}
