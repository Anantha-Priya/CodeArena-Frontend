export type SubmissionStatus = 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR';

// Matches the backend's SubmissionRequest. `status` is supplied by the caller, not computed
// by a judge — v1 has no code execution engine (see API_REFERENCE.md).
export interface SubmissionPayload {
  contestId: number;
  problemId: number;
  language: string;
  sourceCode: string;
  status: SubmissionStatus;
}

export interface Submission {
  id: number;
  problemId: number;
  problemTitle: string;
  contestId: number;
  contestTitle: string;
  language: string;
  status: SubmissionStatus;
  score: number;
  submittedAt: string;
}
