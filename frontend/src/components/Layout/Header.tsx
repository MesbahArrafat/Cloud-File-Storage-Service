import { useState } from 'react';
import { Search, Upload, FolderPlus, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { FileUploadZone } from '../files/FileUploadZone';
import { CreateFolderModal } from '../folders/CreateFolderModal';

interface HeaderProps {
  onSearch: (q: string) => void;
  currentFolderId?: string | null;
}

export function Header({ onSearch, currentFolderId }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-3">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowNewFolder(true)}>
            <FolderPlus className="h-4 w-4" /> New folder
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4" /> Upload
          </Button>

          {/* User */}
          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-4 w-4 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.email}</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-10 z-20 w-48 rounded-lg border bg-white shadow-lg py-1">
                <div className="px-3 py-2 border-b">
                  <p className="text-xs font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showUpload && (
        <Modal isOpen onClose={() => setShowUpload(false)} title="Upload files" size="md">
          <FileUploadZone folderId={currentFolderId} onClose={() => setShowUpload(false)} />
        </Modal>
      )}
      {showNewFolder && <CreateFolderModal parentId={currentFolderId} onClose={() => setShowNewFolder(false)} />}
    </>
  );
}
