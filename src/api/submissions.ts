import { apiClient } from './client';
import type { Submission, SubmissionPayload } from '../types/submission';

export function createSubmission(payload: SubmissionPayload): Promise<Submission> {
  return apiClient.post('/api/submissions', payload);
}

// Plain array, newest first, only the caller's own — see API_REFERENCE.md's gotchas section.
export function listMySubmissions(): Promise<Submission[]> {
  return apiClient.get('/api/submissions/my');
}
