import { useState } from 'react';
import { Download, Star, MoreVertical } from 'lucide-react';
import type { File as FileType } from '../../types';
import { useToggleStar, useTrashFile } from '../../hooks/useFiles';

interface FileRowProps {
  file: FileType;
  isTrash?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileRow({ file, isTrash, selected, onSelect }: FileRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { mutate: toggleStar } = useToggleStar();
  const { mutate: trashFile } = useTrashFile();

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.download_url;
    a.download = file.original_filename;
    a.click();
  };

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${selected ? 'bg-primary-50' : ''}`}
      onClick={() => onSelect?.(file.id)}
    >
      {onSelect && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(file.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-primary-600"
        />
      )}
      <span className="text-xl flex-shrink-0">📄</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
      </div>
      <span className="text-xs text-gray-500 flex-shrink-0">{formatSize(file.size)}</span>
      <span className="text-xs text-gray-500 flex-shrink-0">{new Date(file.created_at).toLocaleDateString()}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); toggleStar({ id: file.id, is_starred: !file.is_starred }); }} className="rounded p-1 hover:bg-gray-200">
          <Star className={`h-4 w-4 ${file.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="rounded p-1 hover:bg-gray-200">
          <Download className="h-4 w-4 text-gray-400" />
        </button>
        {!isTrash && (
          <button onClick={(e) => { e.stopPropagation(); trashFile(file.id); }} className="rounded p-1 hover:bg-gray-200">
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}
