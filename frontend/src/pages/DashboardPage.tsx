import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronRight, Download, Home } from 'lucide-react';
import { useFiles } from '../hooks/useFiles';
import { useFolders, useFolder } from '../hooks/useFolders';
import { filesApi } from '../api/files';
import { FileGrid } from '../components/files/FileGrid';
import { FolderGrid } from '../components/folders/FolderGrid';
import { Button } from '../components/ui/Button';
import type { LayoutContext } from '../components/Layout/AppLayout';
import toast from 'react-hot-toast';

export function DashboardPage() {
  const { searchQuery, currentFolderId, setCurrentFolderId } = useOutletContext<LayoutContext>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);
  const [zipping, setZipping] = useState(false);

  const { data: filesData, isLoading: filesLoading } = useFiles({
    search: searchQuery || undefined,
    folder: searchQuery ? undefined : currentFolderId,
  });

  const { data: allFolders } = useFolders();
  const { data: currentFolder } = useFolder(currentFolderId || '');

  const foldersToShow = currentFolder
    ? (currentFolder.subfolders || [])
    : (allFolders || []).filter((f) => f.parent === null);

  const handleFolderClick = (id: string) => {
    const folder = allFolders?.find((f) => f.id === id) || currentFolder?.subfolders?.find((f) => f.id === id);
    if (folder) {
      setBreadcrumbs((prev) => [...prev, { id, name: folder.name }]);
    }
    setCurrentFolderId(id);
    setSelectedIds(new Set());
  };

  const handleBreadcrumb = (idx: number) => {
    if (idx === -1) {
      setBreadcrumbs([]);
      setCurrentFolderId(null);
    } else {
      setBreadcrumbs((prev) => prev.slice(0, idx + 1));
      setCurrentFolderId(breadcrumbs[idx].id);
    }
    setSelectedIds(new Set());
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleZipDownload = async () => {
    if (selectedIds.size === 0) return;
    setZipping(true);
    try {
      const blob = await filesApi.zipDownload(Array.from(selectedIds));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'download.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download ZIP.');
    } finally {
      setZipping(false);
    }
  };

  return (
    <div>
      {/* Breadcrumbs + toolbar */}
      <div className="flex items-center justify-between mb-6">
        <nav className="flex items-center gap-1 text-sm text-gray-600">
          <button onClick={() => handleBreadcrumb(-1)} className="flex items-center gap-1 hover:text-primary-600 font-medium">
            <Home className="h-4 w-4" /> My Drive
          </button>
          {breadcrumbs.map((bc, i) => (
            <span key={bc.id} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <button onClick={() => handleBreadcrumb(i)} className="hover:text-primary-600 font-medium">{bc.name}</button>
            </span>
          ))}
        </nav>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
            <Button variant="secondary" size="sm" onClick={handleZipDownload} loading={zipping}>
              <Download className="h-4 w-4" /> Download ZIP
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
          </div>
        )}
      </div>

      {/* Folders */}
      {!searchQuery && <FolderGrid folders={foldersToShow} onFolderClick={handleFolderClick} />}

      {/* Files */}
      <div>
        {!searchQuery && <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Files</h2>}
        <FileGrid
          files={filesData?.results || []}
          loading={filesLoading}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          emptyMessage={searchQuery ? 'No files match your search' : 'No files yet. Upload something!'}
        />
      </div>
    </div>
  );
}
