import api from './axios';
import type { File, PaginatedResponse, ShareInfo, FilePermission, ChunkUploadSession } from '../types';

export interface FileListParams {
  search?: string;
  folder?: string | null;
  starred?: boolean;
  page?: number;
}

export const filesApi = {
  list: (params: FileListParams = {}) => {
    const p: Record<string, string> = {};
    if (params.search) p.search = params.search;
    if (params.folder !== undefined && params.folder !== null) p.folder = params.folder;
    else if (params.folder === null) p.folder = 'null';
    if (params.starred) p.starred = 'true';
    if (params.page) p.page = String(params.page);
    return api.get<PaginatedResponse<File>>('/files/', { params: p }).then((r) => r.data);
  },

  get: (id: string) =>
    api.get<File>(`/files/${id}/`).then((r) => r.data),

  upload: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.post<File>('/files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / (e.total ?? 1))),
    }).then((r) => r.data),

  update: (id: string, data: { filename?: string; folder?: string | null; is_public?: boolean; is_starred?: boolean }) =>
    api.patch<File>(`/files/${id}/`, data).then((r) => r.data),

  move: (id: string, folderId: string | null) =>
    api.patch<File>(`/files/${id}/`, { folder: folderId }).then((r) => r.data),

  trash: (id: string) =>
    api.delete(`/files/${id}/`).then((r) => r.data),

  restore: (id: string) =>
    api.post<File>(`/files/${id}/restore/`).then((r) => r.data),

  permanentDelete: (id: string) =>
    api.delete(`/files/${id}/permanent/`),

  listTrash: (page = 1) =>
    api.get<PaginatedResponse<File>>('/files/trash/', { params: { page } }).then((r) => r.data),

  listStarred: (page = 1) =>
    api.get<PaginatedResponse<File>>('/files/starred/', { params: { page } }).then((r) => r.data),

  zipDownload: (fileIds: string[]) =>
    api.post('/files/zip-download/', { file_ids: fileIds }, { responseType: 'blob' }).then((r) => r.data),

  generateShareLink: (fileId: string) =>
    api.post<ShareInfo>(`/share/${fileId}/generate/`).then((r) => r.data),

  getPermissions: (fileId: string) =>
    api.get<FilePermission[]>(`/share/${fileId}/permissions/`).then((r) => r.data),

  addPermission: (fileId: string, data: { shared_with_email: string; can_view: boolean; can_download: boolean }) =>
    api.post<FilePermission>(`/share/${fileId}/permissions/`, data).then((r) => r.data),

  // Chunk upload
  initChunkUpload: (data: { filename: string; total_chunks: number }) =>
    api.post<ChunkUploadSession>('/upload/init/', data).then((r) => r.data),

  uploadChunk: (formData: FormData) =>
    api.post('/upload/chunk/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),

  completeChunkUpload: (data: { upload_id: string; folder?: string | null }) =>
    api.post<File>('/upload/complete/', data).then((r) => r.data),
};
