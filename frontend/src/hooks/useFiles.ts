import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi, type FileListParams } from '../api/files';
import toast from 'react-hot-toast';

export const fileKeys = {
  all: ['files'] as const,
  list: (params: FileListParams) => [...fileKeys.all, 'list', params] as const,
  trash: () => [...fileKeys.all, 'trash'] as const,
  starred: () => [...fileKeys.all, 'starred'] as const,
  detail: (id: string) => [...fileKeys.all, id] as const,
};

export function useFiles(params: FileListParams = {}) {
  return useQuery({
    queryKey: fileKeys.list(params),
    queryFn: () => filesApi.list(params),
  });
}

export function useTrashFiles() {
  return useQuery({ queryKey: fileKeys.trash(), queryFn: () => filesApi.listTrash() });
}

export function useStarredFiles() {
  return useQuery({ queryKey: fileKeys.starred(), queryFn: () => filesApi.listStarred() });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formData, onProgress }: { formData: FormData; onProgress?: (p: number) => void }) =>
      filesApi.upload(formData, onProgress),
    onSuccess: () => { qc.invalidateQueries({ queryKey: fileKeys.all }); toast.success('File uploaded!'); },
    onError: () => toast.error('Upload failed.'),
  });
}

export function useTrashFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => filesApi.trash(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: fileKeys.all }); toast.success('Moved to trash.'); },
    onError: () => toast.error('Failed to trash file.'),
  });
}

export function useRestoreFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => filesApi.restore(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: fileKeys.all }); toast.success('File restored.'); },
    onError: () => toast.error('Failed to restore file.'),
  });
}

export function usePermanentDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => filesApi.permanentDelete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: fileKeys.all }); toast.success('File deleted permanently.'); },
    onError: () => toast.error('Failed to delete file.'),
  });
}

export function useUpdateFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof filesApi.update>[1] }) =>
      filesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: fileKeys.all }); toast.success('File updated.'); },
    onError: () => toast.error('Failed to update file.'),
  });
}

export function useToggleStar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_starred }: { id: string; is_starred: boolean }) =>
      filesApi.update(id, { is_starred }),
    onSuccess: () => qc.invalidateQueries({ queryKey: fileKeys.all }),
  });
}

export function useGenerateShareLink() {
  return useMutation({
    mutationFn: (fileId: string) => filesApi.generateShareLink(fileId),
    onSuccess: () => toast.success('Share link generated!'),
    onError: () => toast.error('Failed to generate share link.'),
  });
}
