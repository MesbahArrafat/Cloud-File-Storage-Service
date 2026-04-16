import api from './axios';
import type { Folder } from '../types';

export const foldersApi = {
  list: () => api.get<Folder[]>('/folders/').then((r) => r.data),

  get: (id: string) => api.get<Folder>(`/folders/${id}/`).then((r) => r.data),

  create: (data: { name: string; parent?: string | null }) =>
    api.post<Folder>('/folders/', data).then((r) => r.data),

  update: (id: string, data: { name: string }) =>
    api.patch<Folder>(`/folders/${id}/`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/folders/${id}/`),
};
