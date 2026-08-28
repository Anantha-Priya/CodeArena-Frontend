export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  topic: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  createdAt: string;
}
