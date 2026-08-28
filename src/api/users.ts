import { apiClient } from './client';
import type { UserProfile } from '../types/user';

export function getMe(): Promise<UserProfile> {
  return apiClient.get('/api/users/me');
}
