import type { File } from '../../types';
import { FileCard } from './FileCard';
import { Spinner } from '../ui/Spinner';

interface FileGridProps {
  files: File[];
  loading?: boolean;
  isTrash?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  emptyMessage?: string;
}

export function FileGrid({ files, loading, isTrash, selectedIds, onSelect, emptyMessage = 'No files here' }: FileGridProps) {
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (files.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <p className="text-4xl mb-3">📂</p>
      <p className="text-sm">{emptyMessage}</p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {files.map((file) => (
        <FileCard key={file.id} file={file} isTrash={isTrash} selected={selectedIds?.has(file.id)} onSelect={onSelect} />
      ))}
    </div>
  );
}
