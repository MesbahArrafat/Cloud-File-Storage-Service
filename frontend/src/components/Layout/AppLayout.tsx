import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export interface LayoutContext {
  searchQuery: string;
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
}

export function AppLayout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onSearch={setSearchQuery} currentFolderId={currentFolderId} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ searchQuery, currentFolderId, setCurrentFolderId } satisfies LayoutContext} />
        </main>
      </div>
    </div>
  );
}
