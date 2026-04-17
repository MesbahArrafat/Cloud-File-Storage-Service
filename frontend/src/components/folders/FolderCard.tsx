import { Folder, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Folder as FolderType } from '../../types';
import { useDeleteFolder } from '../../hooks/useFolders';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface FolderCardProps {
  folder: FolderType;
  onClick: (id: string) => void;
}

export function FolderCard({ folder, onClick }: FolderCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { mutate: deleteFolder, isPending: isDeleting } = useDeleteFolder();

  return (
    <>
      <div
        className="group relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-all cursor-pointer"
        onClick={() => onClick(folder.id)}
      >
        <Folder className="h-8 w-8 text-yellow-500 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{folder.name}</p>
          <p className="text-xs text-gray-500">{folder.subfolder_count} folders · {folder.file_count} files</p>
        </div>
        <div className="relative">
          <button
            className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-gray-100"
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 z-20 w-40 rounded-lg border bg-white shadow-lg py-1">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); setShowMenu(false); }}
              >
                <Trash2 className="h-4 w-4" /> Delete folder
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteFolder(folder.id, { onSuccess: () => setShowDeleteConfirm(false) })}
        title="Delete folder"
        message={`"${folder.name}" and all its contents will be deleted. This action cannot be undone.`}
        confirmLabel="Delete folder"
        danger
        loading={isDeleting}
      />
    </>
  );
}
