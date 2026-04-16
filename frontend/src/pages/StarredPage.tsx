import { useStarredFiles } from '../hooks/useFiles';
import { FileGrid } from '../components/files/FileGrid';

export function StarredPage() {
  const { data, isLoading } = useStarredFiles();
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Starred files</h1>
      <FileGrid files={data?.results || []} loading={isLoading} emptyMessage="No starred files" />
    </div>
  );
}
