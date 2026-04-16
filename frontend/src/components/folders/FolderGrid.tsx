import type { Folder } from '../../types';
import { FolderCard } from './FolderCard';

interface FolderGridProps {
  folders: Folder[];
  onFolderClick: (id: string) => void;
}

export function FolderGrid({ folders, onFolderClick }: FolderGridProps) {
  if (folders.length === 0) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Folders</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mb-6">
        {folders.map((f) => <FolderCard key={f.id} folder={f} onClick={onFolderClick} />)}
      </div>
    </div>
  );
}
