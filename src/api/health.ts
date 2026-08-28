import { apiClient } from './client';

export function getHealth(): Promise<unknown> {
  return apiClient.get('/api/health');
}
