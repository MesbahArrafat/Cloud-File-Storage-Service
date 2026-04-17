import { User, HardDrive } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function formatBytes(bytes: number) {
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(1)} MB`;
}

export function ProfilePage() {
  const { user } = useAuth();
  const usedPct = user && user.storage_limit > 0
    ? Math.min((user.storage_used / user.storage_limit) * 100, 100)
    : 0;

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Profile</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        {/* Avatar & name */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Storage */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Storage Usage</span>
          </div>
          <div className="h-3 rounded-full bg-gray-200 mb-2">
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            {formatBytes(user.storage_used)} used of {formatBytes(user.storage_limit)}
            <span className="ml-2 text-gray-400">({usedPct.toFixed(1)}%)</span>
          </p>
        </div>

        <hr className="border-gray-100" />

        {/* Account details */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Account details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Username</p>
              <p className="font-medium text-gray-900">{user.username}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Member since</p>
              <p className="font-medium text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
