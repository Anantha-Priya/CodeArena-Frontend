export type SubmissionStatus = 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR';

// Matches the backend's SubmissionRequest. `status` is supplied by the caller, not computed
// by a judge — v1 has no code execution engine (see API_REFERENCE.md). `contestId` is omitted
// entirely for a practice submission (a problem solved outside any contest).
export interface SubmissionPayload {
  contestId?: number;
  problemId: number;
  language: string;
  sourceCode: string;
  status: SubmissionStatus;
}

export interface Submission {
  id: number;
  problemId: number;
  problemTitle: string;
  contestId: number | null;
  contestTitle: string | null;
  language: string;
  status: SubmissionStatus;
  score: number;
  submittedAt: string;
}
