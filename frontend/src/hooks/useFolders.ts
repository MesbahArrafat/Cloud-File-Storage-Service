import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foldersApi } from '../api/folders';
import toast from 'react-hot-toast';

export const folderKeys = {
  all: ['folders'] as const,
  list: () => [...folderKeys.all, 'list'] as const,
  detail: (id: string) => [...folderKeys.all, id] as const,
};

export function useFolders() {
  return useQuery({ queryKey: folderKeys.list(), queryFn: foldersApi.list });
}

export function useFolder(id: string) {
  return useQuery({ queryKey: folderKeys.detail(id), queryFn: () => foldersApi.get(id), enabled: !!id });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; parent?: string | null }) => foldersApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: folderKeys.all }); toast.success('Folder created.'); },
    onError: () => toast.error('Failed to create folder.'),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => foldersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: folderKeys.all }); toast.success('Folder deleted.'); },
    onError: () => toast.error('Failed to delete folder.'),
  });
}
