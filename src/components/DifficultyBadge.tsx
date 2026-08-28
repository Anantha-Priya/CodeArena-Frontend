import type { Difficulty } from '../types/problem';

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`badge badge--${difficulty.toLowerCase()}`}>{difficulty}</span>;
}
