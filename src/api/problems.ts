import { apiClient } from './client';
import type { Page } from '../types/api';
import type { Difficulty, Problem, ProblemPayload } from '../types/problem';

export interface ListProblemsParams {
  difficulty?: Difficulty;
  topic?: string;
  page?: number;
  size?: number;
}

export function listProblems(params: ListProblemsParams = {}): Promise<Page<Problem>> {
  const query = new URLSearchParams();
  if (params.difficulty) query.set('difficulty', params.difficulty);
  if (params.topic) query.set('topic', params.topic);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));

  const qs = query.toString();
  return apiClient.get(`/api/problems${qs ? `?${qs}` : ''}`);
}

export function getProblem(id: string): Promise<Problem> {
  return apiClient.get(`/api/problems/${id}`);
}

export function createProblem(payload: ProblemPayload): Promise<Problem> {
  return apiClient.post('/api/problems', payload);
}

export function updateProblem(id: number, payload: ProblemPayload): Promise<Problem> {
  return apiClient.put(`/api/problems/${id}`, payload);
}

export function deleteProblem(id: number): Promise<void> {
  return apiClient.delete(`/api/problems/${id}`);
}
