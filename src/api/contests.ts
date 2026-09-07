import { apiClient } from './client';
import type { Contest, ContestPayload, ContestStatusInfo } from '../types/contest';
import type { LeaderboardEntry } from '../types/leaderboard';
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

export function deleteContest(id: number): Promise<void> {
  return apiClient.delete(`/api/contests/${id}`);
}

export function attachProblemToContest(contestId: number, problemId: number): Promise<void> {
  return apiClient.post(`/api/contests/${contestId}/problems/${problemId}`);
}

export function detachProblemFromContest(contestId: number, problemId: number): Promise<void> {
  return apiClient.delete(`/api/contests/${contestId}/problems/${problemId}`);
}

// Plain array, already sorted by rank ascending — never re-sort client-side. Fetch once on
// page load, not on an interval: viewing this after the contest ends also applies a
// rating bonus server-side, guarded to apply at most once per participant, so there's no
// need (or benefit) to poll it the way contest status is polled.
export function getContestLeaderboard(id: string): Promise<LeaderboardEntry[]> {
  return apiClient.get(`/api/contests/${id}/leaderboard`);
}
