import api from './axios';
import type { AuthResponse, User } from '../types';

export const authApi = {
  register: (data: { username: string; email: string; password: string; password_confirm: string }) =>
    api.post<AuthResponse>('/auth/register/', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login/', data).then((r) => r.data),

  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }).then((r) => r.data),

  getProfile: () =>
    api.get<User>('/auth/profile/').then((r) => r.data),

  updateProfile: (data: Partial<User>) =>
    api.patch<User>('/auth/profile/', data).then((r) => r.data),
};
