import { NavLink } from 'react-router-dom';
import { HardDrive, Star, Trash2, Activity, Cloud, FolderOpen, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/', icon: HardDrive, label: 'My Drive', exact: true },
  { to: '/starred', icon: Star, label: 'Starred' },
  { to: '/trash', icon: Trash2, label: 'Trash' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/profile', icon: User, label: 'Profile' },
];

function formatBytes(bytes: number) {
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(1)} MB`;
}

export function Sidebar() {
  const { user } = useAuth();
  const usedPct = user ? Math.min((user.storage_used / user.storage_limit) * 100, 100) : 0;

  return (
    <aside className="flex flex-col w-60 border-r border-gray-200 bg-white h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <Cloud className="h-7 w-7 text-primary-600" />
        <span className="text-lg font-bold text-gray-900">CloudDrive</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Storage */}
      {user && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-600">Storage</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 mb-1">
            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${usedPct}%` }} />
          </div>
          <p className="text-xs text-gray-500">
            {formatBytes(user.storage_used)} of {formatBytes(user.storage_limit)} used
          </p>
        </div>
      )}
    </aside>
  );
}
