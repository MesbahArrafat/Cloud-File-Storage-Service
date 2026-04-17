import { useTrashFiles } from '../hooks/useFiles';
import { FileGrid } from '../components/files/FileGrid';

export function TrashPage() {
  const { data, isLoading } = useTrashFiles();
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Trash</h1>
      <p className="text-sm text-gray-500 mb-6">Files in trash can be restored or permanently deleted.</p>
      <FileGrid files={data?.results || []} loading={isLoading} isTrash emptyMessage="Trash is empty" />
    </div>
  );
}
