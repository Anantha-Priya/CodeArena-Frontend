export type Role = 'USER' | 'ADMIN';

export interface UserProfile {
  username: string;
  rating: number;
  problemsSolved: number;
  contestsJoined: number;
  role: Role;
}
