import { apiClient } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types/auth';

export function register(data: RegisterRequest): Promise<void> {
  return apiClient.post('/api/auth/register', data);
}

export function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient.post('/api/auth/login', data);
}
