import { useState } from 'react';
import { Folder, Home } from 'lucide-react';
import type { File as FileType } from '../../types';
import { useFolders } from '../../hooks/useFolders';
import { useMoveFile } from '../../hooks/useFiles';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface MoveModalProps {
  file: FileType;
  onClose: () => void;
}

export function MoveModal({ file, onClose }: MoveModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(file.folder);
  const { data: folders = [] } = useFolders();
  const { mutate: moveFile, isPending } = useMoveFile();

  const rootFolders = folders.filter((f) => f.parent === null);

  const handleMove = () => {
    moveFile({ id: file.id, folderId: selectedFolderId }, { onSuccess: onClose });
  };

  return (
    <Modal isOpen onClose={onClose} title={`Move "${file.filename}"`} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Select a destination folder:</p>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
          {/* Root option */}
          <button
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
              selectedFolderId === null ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
            }`}
            onClick={() => setSelectedFolderId(null)}
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">My Drive (root)</span>
          </button>
          {rootFolders.map((folder) => (
            <button
              key={folder.id}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                selectedFolderId === folder.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
              }`}
              onClick={() => setSelectedFolderId(folder.id)}
            >
              <Folder className="h-4 w-4 flex-shrink-0 text-yellow-500" />
              <span className="truncate">{folder.name}</span>
            </button>
          ))}
          {rootFolders.length === 0 && (
            <p className="px-3 py-4 text-sm text-gray-400 text-center">No folders available</p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleMove} loading={isPending} disabled={selectedFolderId === file.folder}>
            Move here
          </Button>
        </div>
      </div>
    </Modal>
  );
}
