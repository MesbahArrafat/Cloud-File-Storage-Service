import { useState } from 'react';
import { File, Star, Trash2, Download, Share2, Eye, MoreVertical, RotateCcw, Trash } from 'lucide-react';
import type { File as FileType } from '../../types';
import { useTrashFile, useRestoreFile, usePermanentDeleteFile, useToggleStar } from '../../hooks/useFiles';
import { FilePreviewModal } from './FilePreviewModal';
import { RenameModal } from './RenameModal';
import { ShareModal } from './ShareModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface FileCardProps {
  file: FileType;
  isTrash?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

const MIME_ICONS: Record<string, string> = {
  'image/jpeg': '🖼️', 'image/png': '🖼️', 'image/gif': '🖼️', 'image/webp': '🖼️',
  'application/pdf': '📄', 'video/mp4': '🎬', 'audio/mpeg': '🎵',
  'text/plain': '📝', 'application/zip': '🗜️',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
};

function getIcon(mimeType: string) {
  return MIME_ICONS[mimeType] || '📁';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export function FileCard({ file, isTrash, selected, onSelect }: FileCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { mutate: trashFile } = useTrashFile();
  const { mutate: restoreFile } = useRestoreFile();
  const { mutate: permanentDelete, isPending: isDeleting } = usePermanentDeleteFile();
  const { mutate: toggleStar } = useToggleStar();

  const isPreviewable = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'].includes(file.mime_type);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.download_url;
    a.download = file.original_filename;
    a.click();
  };

  return (
    <>
      <div
        className={`group relative rounded-xl border bg-white p-4 transition-all hover:shadow-md cursor-pointer ${
          selected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
        }`}
        onClick={() => onSelect?.(file.id)}
      >
        {/* Checkbox */}
        {onSelect && (
          <div
            className={`absolute left-3 top-3 h-4 w-4 rounded border transition-opacity ${
              selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(file.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-gray-300 text-primary-600"
            />
          </div>
        )}

        {/* Star */}
        <button
          className="absolute right-8 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); toggleStar({ id: file.id, is_starred: !file.is_starred }); }}
        >
          <Star className={`h-4 w-4 ${file.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
        </button>

        {/* Menu */}
        <div className="absolute right-3 top-3">
          <button
            className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-gray-100"
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 z-20 w-44 rounded-lg border bg-white shadow-lg py-1">
              {isPreviewable && (
                <MenuBtn icon={<Eye className="h-4 w-4" />} label="Preview" onClick={() => { setShowPreview(true); setShowMenu(false); }} />
              )}
              <MenuBtn icon={<Download className="h-4 w-4" />} label="Download" onClick={() => { handleDownload(); setShowMenu(false); }} />
              {!isTrash && (
                <>
                  <MenuBtn icon={<File className="h-4 w-4" />} label="Rename" onClick={() => { setShowRename(true); setShowMenu(false); }} />
                  <MenuBtn icon={<Share2 className="h-4 w-4" />} label="Share" onClick={() => { setShowShare(true); setShowMenu(false); }} />
                  <MenuBtn icon={<Trash2 className="h-4 w-4" />} label="Move to trash" onClick={() => { trashFile(file.id); setShowMenu(false); }} danger />
                </>
              )}
              {isTrash && (
                <>
                  <MenuBtn icon={<RotateCcw className="h-4 w-4" />} label="Restore" onClick={() => { restoreFile(file.id); setShowMenu(false); }} />
                  <MenuBtn icon={<Trash className="h-4 w-4" />} label="Delete forever" onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} danger />
                </>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        <div className="mb-3 text-4xl">{getIcon(file.mime_type)}</div>

        {/* Name */}
        <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
        <p className="text-xs text-gray-500 mt-1">{formatSize(file.size)} · {formatDate(file.created_at)}</p>
      </div>

      {/* Modals */}
      {showPreview && <FilePreviewModal file={file} onClose={() => setShowPreview(false)} />}
      {showRename && <RenameModal file={file} onClose={() => setShowRename(false)} />}
      {showShare && <ShareModal file={file} onClose={() => setShowShare(false)} />}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => permanentDelete(file.id)}
        title="Delete permanently"
        message={`"${file.filename}" will be deleted forever. This action cannot be undone.`}
        confirmLabel="Delete forever"
        danger
        loading={isDeleting}
      />
    </>
  );
}

function MenuBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${danger ? 'text-red-600' : 'text-gray-700'}`}
      onClick={onClick}
    >
      {icon} {label}
    </button>
  );
}
