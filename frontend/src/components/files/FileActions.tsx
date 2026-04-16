import type { File } from '../../types';
import { useTrashFile, useRestoreFile, usePermanentDeleteFile, useToggleStar } from '../../hooks/useFiles';

interface FileActionsProps {
  file: File;
  isTrash?: boolean;
}

export function FileActions({ file, isTrash }: FileActionsProps) {
  const { mutate: trashFile } = useTrashFile();
  const { mutate: restoreFile } = useRestoreFile();
  const { mutate: permanentDelete } = usePermanentDeleteFile();
  const { mutate: toggleStar } = useToggleStar();

  return (
    <div className="flex items-center gap-2">
      {!isTrash && (
        <>
          <button onClick={() => toggleStar({ id: file.id, is_starred: !file.is_starred })} className="text-xs text-gray-600 hover:text-yellow-500">
            {file.is_starred ? 'Unstar' : 'Star'}
          </button>
          <button onClick={() => trashFile(file.id)} className="text-xs text-red-600 hover:text-red-700">
            Trash
          </button>
        </>
      )}
      {isTrash && (
        <>
          <button onClick={() => restoreFile(file.id)} className="text-xs text-green-600 hover:text-green-700">
            Restore
          </button>
          <button onClick={() => permanentDelete(file.id)} className="text-xs text-red-600 hover:text-red-700">
            Delete forever
          </button>
        </>
      )}
    </div>
  );
}
