import { apiClient } from './client';
import type { UserProfile } from '../types/user';

export function getMe(): Promise<UserProfile> {
  return apiClient.get('/api/users/me');
}

// Admin only — same shape as getMe(), one entry per user on the platform.
export function listUsers(): Promise<UserProfile[]> {
  return apiClient.get('/api/users');
}
