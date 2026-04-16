import type { File } from '../../types';
import { FileRow } from './FileRow';
import { Spinner } from '../ui/Spinner';

interface FileListProps {
  files: File[];
  loading?: boolean;
  isTrash?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  emptyMessage?: string;
}

export function FileList({ files, loading, isTrash, selectedIds, onSelect, emptyMessage = 'No files here' }: FileListProps) {
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (files.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <p className="text-4xl mb-3">📂</p>
      <p className="text-sm">{emptyMessage}</p>
    </div>
  );
  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
      {files.map((file) => (
        <FileRow key={file.id} file={file} isTrash={isTrash} selected={selectedIds?.has(file.id)} onSelect={onSelect} />
      ))}
    </div>
  );
}
